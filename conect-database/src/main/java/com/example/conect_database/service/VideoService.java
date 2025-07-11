package com.example.conect_database.service;

import com.example.conect_database.entity.Script;
import com.example.conect_database.entity.Scene;
import com.example.conect_database.entity.Video;
import com.example.conect_database.Repository.ScriptRepository;
import com.example.conect_database.Repository.VideoRepository;
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
    private final VideoRepository videoRepository;
    private final CloudinaryService cloudinaryService;

    public Video generateVideoFromScript(Long scriptId) throws Exception {

        // 1. Lấy script và ảnh/audio
        Script script = scriptRepository.findById(scriptId)
                .orElseThrow(() -> {
                    return new RuntimeException("Script not found");
                });

        // String audioUrl = script.getAudioUrl(); // Đã bỏ trường này, nếu cần hãy lấy từ scene
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

        
        // Tải ảnh và audio từng cảnh
        List<Path> imagePaths = new ArrayList<>();
        List<Path> audioPaths = new ArrayList<>();
        for (int i = 0; i < scenes.size(); i++) {
            // Tải ảnh
            Path imgPath = tempDir.resolve(String.format("img%03d.jpg", i));
            downloadFileWithTimeout(scenes.get(i).getImageUrl(), imgPath);
            imagePaths.add(imgPath);
            // Tải audio
            Path audPath = tempDir.resolve(String.format("audio%03d.mp3", i));
            downloadFileWithTimeout(scenes.get(i).getAudioUrl(), audPath);
            audioPaths.add(audPath);
        }

        // Tạo video cho từng scene (ảnh + audio)
        List<Path> sceneVideoPaths = new ArrayList<>();
        for (int i = 0; i < scenes.size(); i++) {
            Path sceneVideo = tempDir.resolve(String.format("scene%03d.mp4", i));
            ProcessBuilder pb = new ProcessBuilder(
                "ffmpeg",
                "-loop", "1",
                "-i", imagePaths.get(i).toString(),
                "-i", audioPaths.get(i).toString(),
                "-c:v", "libx264",
                "-c:a", "aac",
                "-shortest",
                "-pix_fmt", "yuv420p",
                "-tune", "stillimage",
                "-y", sceneVideo.toString()
            );
            pb.directory(tempDir.toFile());
            pb.redirectErrorStream(true);
            Process process = pb.start();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    logger.info("ffmpeg scene {}: {}", i, line);
                }
            }
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                throw new RuntimeException("ffmpeg scene " + i + " failed with exit code: " + exitCode);
            }
            sceneVideoPaths.add(sceneVideo);
        }

        // Ghép các video cảnh lại thành video cuối cùng
        Path concatList = tempDir.resolve("concat.txt");
        try (BufferedWriter writer = Files.newBufferedWriter(concatList)) {
            for (Path p : sceneVideoPaths) {
                writer.write("file '" + p.toString() + "'\n");
            }
        }
        Path videoPath = tempDir.resolve("output.mp4");
        ProcessBuilder concatPb = new ProcessBuilder(
            "ffmpeg",
            "-f", "concat",
            "-safe", "0",
            "-i", concatList.toString(),
            "-c", "copy",
            "-y", videoPath.toString()
        );
        concatPb.directory(tempDir.toFile());
        concatPb.redirectErrorStream(true);
        Process concatProcess = concatPb.start();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(concatProcess.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                logger.info("ffmpeg concat: {}", line);
            }
        }
        int concatExit = concatProcess.waitFor();
        if (concatExit != 0) {
            throw new RuntimeException("ffmpeg concat failed with exit code: " + concatExit);
        }

        // Upload video lên cloud
        String videoUrl = cloudinaryService.uploadVideo(Files.readAllBytes(videoPath), "video/");

        // Lưu video vào database
        Video video = Video.builder()
                .script(script)
                .videoUrl(videoUrl)
                .build();
        videoRepository.save(video);

        // Dọn thư mục tạm
        cleanupTempDirectory(tempDir);

        return video;
    }

    public List<Video> getAllVideos() {
        return videoRepository.findAll();
    }

    public void deleteVideo(Long id) {
        Video video = videoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Video not found"));
        
        // Xóa video khỏi Cloudinary (nếu cần)
        // cloudinaryService.deleteVideo(video.getVideoUrl());
        
        // Xóa video khỏi database
        videoRepository.delete(video);
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


    public Path copyWhisperScriptToTemp() throws IOException {
        // Đọc file trong resources
        InputStream inputStream = getClass().getClassLoader().getResourceAsStream("whisper-split/whisper_split.py");
        if (inputStream == null) {
            throw new FileNotFoundException("Không tìm thấy whisper_split.py trong resources");
        }

        // Ghi ra file tạm
        Path tempScriptPath = Files.createTempFile("whisper_split", ".py");
        Files.copy(inputStream, tempScriptPath, StandardCopyOption.REPLACE_EXISTING);

        return tempScriptPath;
    }
    
}
