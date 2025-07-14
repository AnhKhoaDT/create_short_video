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
            // --- Chia description thành từng câu, mỗi câu chiếm 1/n thời lượng audio ---
            String desc = scenes.get(i).getDescription();
            if (desc == null) desc = "";
            // Tách theo dấu chấm, chấm hỏi, chấm than, dấu phẩy
            String[] sentences = desc.split("(?<=[.!?,]) ");
            double duration = getAudioDurationInSeconds(audioPaths.get(i));
            double perSentence = duration / Math.max(1, sentences.length);
            StringBuilder filter = new StringBuilder();
            for (int j = 0; j < sentences.length; j++) {
                double start = j * perSentence;
                double end = (j + 1) * perSentence;
                String txt = sentences[j].replace("'", "\\'").replaceAll("(.{1,40})(\\s+|$)", "$1\\n");
                filter.append(String.format(
                    "drawtext=text='%s':fontcolor=white:fontsize=48:box=1:boxcolor=black@0.5:boxborderw=10:x=(w-text_w)/2:y=h-text_h-40:enable='between(t,%.2f,%.2f)',",
                    txt, start, end
                ));
            }
            if (filter.length() > 0) filter.setLength(filter.length() - 1); // bỏ dấu phẩy cuối
            // --- Tạo video scene với text mô tả từng câu ---
            ProcessBuilder pb = new ProcessBuilder(
                "ffmpeg",
                "-loop", "1",
                "-i", imagePaths.get(i).toString(),
                "-i", audioPaths.get(i).toString(),
                "-vf", filter.toString(),
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

   

        // --- TẠO FILE VTT PHỤ ĐỀ ---
        StringBuilder vttBuilder = new StringBuilder();
        vttBuilder.append("WEBVTT\n\n");
        double start = 0;
        for (int i = 0; i < scenes.size(); i++) {
            double duration = getAudioDurationInSeconds(audioPaths.get(i));
            double end = start + duration;
            String startStr = String.format("%02d:%02d:%06.3f", (int)(start/3600), ((int)(start/60))%60, start%60).replace(',', '.');
            String endStr = String.format("%02d:%02d:%06.3f", (int)(end/3600), ((int)(end/60))%60, end%60).replace(',', '.');
            vttBuilder.append(startStr.substring(0,12)).append(" --> ").append(endStr.substring(0,12)).append("\n");
            // Lấy toàn bộ mô tả cảnh
            String desc = scenes.get(i).getDescription().trim();
            // Loại bỏ các ký tự đặc biệt không mong muốn khỏi phụ đề
            desc = desc.replace("\"", "")
                       .replace(":", "")
                       .replace("“", "")
                       .replace("”", "")
                       .replace("'", "")
                       .replace("‘", "")
                       .replace("’", "");
            vttBuilder.append(desc).append("\n\n");
            start = end;
        }
        byte[] vttBytes = vttBuilder.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        String subtitleVttUrl = cloudinaryService.uploadTextFile(vttBytes, "subtitle/");

        // Lấy title và description từ script.title (nếu có)
        String videoTitle = "";
        String videoDescription = "";
        if (script.getTitle() != null && !script.getTitle().isEmpty()) {
            String[] sentences = script.getTitle().split("[.!?\n]");
            videoTitle = sentences.length > 0 ? sentences[0].trim() : script.getTitle();
            videoDescription = sentences.length > 1 ? sentences[1].trim() : "";
        }

        // Lưu video vào database
        Video video = Video.builder()
                .script(script)
                .videoUrl(videoUrl)
                .subtitleVttUrl(subtitleVttUrl)
                .title(videoTitle)
                .description(videoDescription)
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

    public Video updateVideoMeta(Long id, String title, String description) {
        Video video = videoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Video not found"));
        video.setTitle(title);
        video.setDescription(description != null ? description : "");
        return videoRepository.save(video);
    }

    public Video getVideoById(Long id) {
        return videoRepository.findById(id).orElse(null);
    }

    public Video updateYouTubeStatus(Long id, boolean youtubeUploaded, String youtubeUrl) {
        Video video = videoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Video not found"));
        video.setYoutubeUploaded(youtubeUploaded);
        if (youtubeUrl != null && !youtubeUrl.isEmpty()) {
            video.setYoutubeUrl(youtubeUrl);
        }
        return videoRepository.save(video);
    }

    public Video increaseView(Long id) {
        Video video = videoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Video not found"));
        // Nếu chưa có trường viewCount thì cần thêm vào entity Video
        int current = 0;
        try {
            java.lang.reflect.Field f = video.getClass().getDeclaredField("viewCount");
            f.setAccessible(true);
            current = (int) f.get(video);
            f.set(video, current + 1);
        } catch (Exception e) {
            // Nếu chưa có trường viewCount thì bỏ qua
        }
        return videoRepository.save(video);
    }

    public Video fetchAndUpdateYouTubeView(Long id) {
        System.out.println("[YouTubeView][Backend] Bắt đầu lấy view cho videoId DB: " + id);
        Video video = videoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Video not found"));
        String youtubeUrl = video.getYoutubeUrl();
        System.out.println("[YouTubeView][Backend] youtubeUrl: " + youtubeUrl);
        if (youtubeUrl == null || youtubeUrl.isEmpty()) return video;
        // Lấy videoId từ url
        String videoId = null;
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("[?&]v=([\\w-]+)").matcher(youtubeUrl);
        if (matcher.find()) videoId = matcher.group(1);
        System.out.println("[YouTubeView][Backend] videoId: " + videoId);
        if (videoId == null) return video;
        try {
            String apiKey = "AIzaSyAqaEYp2Ju0FzzAh_QkmM-gfH45xWWsuTQ";
            String url = "https://www.googleapis.com/youtube/v3/videos?part=statistics&id=" + videoId + "&key=" + apiKey;
            System.out.println("[YouTubeView][Backend] Gọi API: " + url);
            java.net.URL apiUrl = new java.net.URL(url);
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) apiUrl.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            conn.setRequestProperty("Accept", "application/json");
            int status = conn.getResponseCode();
            System.out.println("[YouTubeView][Backend] HTTP status: " + status);
            if (status == 200) {
                java.io.InputStream is = conn.getInputStream();
                String json = new String(is.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
                is.close();
                System.out.println("[YouTubeView][Backend] Response body: " + json);
                com.fasterxml.jackson.databind.JsonNode node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(json);
                if (node.has("items") && node.get("items").size() > 0) {
                    com.fasterxml.jackson.databind.JsonNode statistics = node.get("items").get(0).get("statistics");
                    if (statistics != null && statistics.has("viewCount")) {
                        String viewStr = statistics.get("viewCount").asText();
                        int view = Integer.parseInt(viewStr);
                        System.out.println("[YouTubeView][Backend] View count fetched: " + view);
                        video.setViewCountYoutube(view);
                        return videoRepository.save(video);
                    } else {
                        System.out.println("[YouTubeView][Backend] Không có viewCount trong statistics");
                    }
                } else {
                    System.out.println("[YouTubeView][Backend] Không có items trong response");
                }
            } else if (status == 403) {
                System.err.println("[YouTubeView][Backend] 403 Forbidden - API key có thể không có quyền hoặc quota exceeded");
            } else if (status == 404) {
                System.err.println("[YouTubeView][Backend] 404 Not Found - Video có thể đã bị xóa hoặc private");
            } else {
                System.err.println("[YouTubeView][Backend] Unexpected status code: " + status);
                try {
                    java.io.InputStream errorStream = conn.getErrorStream();
                    if (errorStream != null) {
                        String errorBody = new String(errorStream.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
                        System.err.println("[YouTubeView][Backend] Error response: " + errorBody);
                    }
                } catch (Exception e) {
                    System.err.println("[YouTubeView][Backend] Không đọc được error response: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("[YouTubeView][Backend] Lỗi khi lấy view: " + e.getMessage());
            e.printStackTrace();
        }
        return video;
    }

    public List<Video> fetchAndUpdateAllYouTubeViews() {
        List<Video> videos = videoRepository.findAll();
        for (Video video : videos) {
            if (video.isYoutubeUploaded() && video.getYoutubeUrl() != null && !video.getYoutubeUrl().isEmpty()) {
                try {
                    fetchAndUpdateYouTubeView(video.getId());
                } catch (Exception e) {
                    System.err.println("[YouTubeView][Backend] Lỗi cập nhật view cho videoId: " + video.getId() + ", error: " + e.getMessage());
                }
            }
        }
        return videoRepository.findAll(); // Lấy lại danh sách đã cập nhật view
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
