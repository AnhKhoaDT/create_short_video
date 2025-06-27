package com.example.conect_database.service;

import com.example.conect_database.entity.Script;
import com.example.conect_database.entity.Scene;
import com.example.conect_database.Repository.ScriptRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.URL;
import java.net.URLConnection;
import java.nio.file.*;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class VideoService {
    private static final Logger logger = LoggerFactory.getLogger(VideoService.class);

    private final ScriptRepository scriptRepository;
    private final CloudinaryService cloudinaryService;

    public String generateVideoFromScript(Long scriptId) throws Exception {

        // 1. Lấy script và ảnh/audio
        Script script = scriptRepository.findById(scriptId)
                .orElseThrow(() -> {
                    return new RuntimeException("Script not found");
                });

        String audioUrl = script.getAudioUrl();
        List<Scene> scenes = script.getScenes();
        List<String> imageUrls = scenes.stream()
                .map(Scene::getImageUrl)
                .collect(Collectors.toList());

        String fullText = scenes.stream()
                .map(Scene::getDescription)
                .collect(Collectors.joining(" "));
    
        List<Integer> sceneSplitIndexes = splitSceneByKeywords(fullText);

        // 2. Tạo thư mục tạm
        Path tempDir = Files.createTempDirectory("video-gen");

        
        // Tải ảnh từng cảnh
        for (int i = 0; i < imageUrls.size(); i++) {
            downloadFileWithTimeout(imageUrls.get(i), tempDir.resolve(String.format("img%03d.jpg", i)));
        }

        // 4. Tải audio về
        Path audioPath = tempDir.resolve("audio.mp3");
        downloadFileWithTimeout(audioUrl, audioPath);

        // Gọi script Python whisper_split.py để sinh scene_timestamps.json
        try {
            ProcessBuilder whisperPb = new ProcessBuilder(
                "python", ".." + File.separator + "whisper-split" + File.separator + "whisper_split.py", audioPath.toString()
            );
            whisperPb.directory(tempDir.toFile());
            whisperPb.redirectErrorStream(true);
            Process whisperProcess = whisperPb.start();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(whisperProcess.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    logger.info("whisper: {}", line);
                }
            }
            int exitCode = whisperProcess.waitFor();
            if (exitCode != 0) {
                logger.warn("Whisper script failed with exit code: {}", exitCode);
            }
        } catch (Exception e) {
            logger.warn("Không thể chạy whisper_split.py: {}", e.getMessage());
        }

        // Đọc timestamp từ file JSON nếu có
        List<Double> sceneTimestamps = new ArrayList<>();
        Path whisperJsonPath = tempDir.resolve("scene_timestamps.json");
        if (Files.exists(whisperJsonPath)) {
            try (BufferedReader br = Files.newBufferedReader(whisperJsonPath)) {
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) sb.append(line);
                String json = sb.toString();
                json = json.replaceAll("\\[|\\]", "");
                if (!json.trim().isEmpty()) {
                    for (String s : json.split(",")) {
                        sceneTimestamps.add(Double.parseDouble(s.trim()));
                    }
                }
            } catch (Exception e) {
                logger.warn("Không đọc được scene_timestamps.json, sẽ chia đều duration: {}", e.getMessage());
            }
        }

        // Lấy tổng thời lượng audio
        double audioDuration = getAudioDurationInSeconds(audioPath); // dùng ffprobe
        int sceneCount = imageUrls.size();
        List<Double> durations = new ArrayList<>();
        if (sceneTimestamps.size() > 0) {
            // Tính duration từng scene dựa vào timestamp
            for (int i = 0; i < sceneCount; i++) {
                double start = (i == 0) ? 0 : sceneTimestamps.get(i - 1);
                double end = (i < sceneTimestamps.size()) ? sceneTimestamps.get(i) : audioDuration;
                durations.add(end - start);
            }
        } else {
            // Fallback: chia đều
            double durationPerScene = audioDuration / sceneCount;
            for (int i = 0; i < sceneCount; i++) durations.add(durationPerScene);
        }

        // Tạo file images.txt cho ffmpeg slideshow
        Path listFile = tempDir.resolve("images.txt");
        try (BufferedWriter writer = Files.newBufferedWriter(listFile)) {
            for (int i = 0; i < sceneCount; i++) {
                writer.write("file 'img" + String.format("%03d", i) + ".jpg'\n");
                writer.write("duration " + durations.get(i) + "\n");
            }
            // Ghi lặp lại ảnh cuối (ffmpeg yêu cầu để hiển thị đúng)
            writer.write("file 'img" + String.format("%03d", sceneCount - 1) + ".jpg'\n");
        }

        // 5. Tạo video từ ảnh + audio
        Path videoPath = tempDir.resolve("output.mp4");
        ProcessBuilder pb = new ProcessBuilder(
                "ffmpeg",
                "-f", "concat",
                "-safe", "0",
                "-i", listFile.toString(),
                "-i", audioPath.toString(),
                "-c:v", "libx264",        // Tuỳ chọn GPU preset (có thể dùng: default, fast, slow, p1-p7)
                "-c:a", "aac",
                "-shortest",
                "-pix_fmt", "yuv420p",
                "-y", videoPath.toString()
        );
        pb.directory(tempDir.toFile());
        pb.redirectErrorStream(true);

        Process process = pb.start();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                logger.info("ffmpeg: {}", line);
            }
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("ffmpeg failed with exit code: " + exitCode);
        }


     //upload
        String videoUrl = cloudinaryService.uploadVideo(Files.readAllBytes(videoPath), "video/");

        // 7. Dọn thư mục tạm
        cleanupTempDirectory(tempDir);

        return videoUrl;
    }

    private void downloadFileWithTimeout(String urlStr, Path targetPath) throws IOException {
        URL url = new URL(urlStr);
        URLConnection conn = url.openConnection();
        conn.setConnectTimeout(5000); // 5 giây timeout kết nối
        conn.setReadTimeout(10000);   // 10 giây timeout đọc dữ liệu

        try (InputStream in = conn.getInputStream()) {
            Files.copy(in, targetPath, StandardCopyOption.REPLACE_EXISTING);
        }
    }

    private void cleanupTempDirectory(Path dir) {
        try {
            Files.walk(dir)
                    .sorted(Comparator.reverseOrder())
                    .map(Path::toFile)
                    .forEach(File::delete);
           
        } catch (Exception e) {
            logger.warn("Không thể xoá thư mục tạm {}: {}", dir, e.getMessage());
        }
    }
    // hàm tách duration
    private List<Integer> splitSceneByKeywords(String text) {
        List<String> keywords = List.of("Tiếp đến", "Sau đó", "Trong khi đó", "Lúc này");
        List<Integer> indexes = new ArrayList<>();
        for (String keyword : keywords) {
            int index = text.indexOf(keyword);
            if (index != -1) indexes.add(index);
        }
        indexes.sort(Integer::compare);
        return indexes;
    }
    // hàm lấy thời lượng audio 
    private double getAudioDurationInSeconds(Path audioPath) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                audioPath.toString()
        );
        pb.redirectErrorStream(true);
        Process process = pb.start();
    
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line = reader.readLine();
            return line != null ? Double.parseDouble(line) : 0;
        }
    }
    
}
