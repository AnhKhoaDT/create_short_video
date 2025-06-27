package com.example.conect_database.service;

import com.example.conect_database.entity.Script;
import com.example.conect_database.entity.Scene;
import com.example.conect_database.Repository.ScriptRepository;
import com.example.conect_database.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.URL;
import java.nio.file.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VideoService {
    private static final Logger logger = LoggerFactory.getLogger(VideoService.class);

    private final ScriptRepository scriptRepository;
    private final CloudinaryService cloudinaryService;

    public String generateVideoFromScript(Long scriptId) throws Exception {
        logger.info("Bắt đầu generate video cho scriptId: {}", scriptId);

        Script script = scriptRepository.findById(scriptId)
                .orElseThrow(() -> {
                    logger.error("Không tìm thấy Script với id: {}", scriptId);
                    return new RuntimeException("Script not found");
                });
        String audioUrl = script.getAudioUrl();
        List<String> imageUrls = script.getScenes().stream()
                .map(Scene::getImageUrl)
                .collect(Collectors.toList());

        logger.info("Tìm thấy {} ảnh cho scriptId: {}", imageUrls.size(), scriptId);
        logger.debug("Danh sách imageUrls: {}", imageUrls);
        logger.info("Audio url: {}", audioUrl);

        // 1. Tải ảnh về thư mục tạm
        Path tempDir = Files.createTempDirectory("video-gen");
        logger.info("Tạo thư mục tạm: {}", tempDir.toAbsolutePath());
        for (int i = 0; i < imageUrls.size(); i++) {
            String imgUrl = imageUrls.get(i);
            Path imgPath = tempDir.resolve(String.format("img%03d.jpg", i));
            logger.info("Đang tải ảnh {} về {}", imgUrl, imgPath.toAbsolutePath());
            try (InputStream in = new URL(imgUrl).openStream()) {
                Files.copy(in, imgPath, StandardCopyOption.REPLACE_EXISTING);
                logger.info("Tải thành công ảnh {}", imgPath.getFileName());
            } catch (Exception e) {
                logger.error("Lỗi khi tải ảnh {}: {}", imgUrl, e.getMessage(), e);
                throw e;
            }
        }
        // 2. Tải audio về
        Path audioPath = tempDir.resolve("audio.mp3");
        logger.info("Đang tải audio {} về {}", audioUrl, audioPath.toAbsolutePath());
        try (InputStream in = new URL(audioUrl).openStream()) {
            Files.copy(in, audioPath, StandardCopyOption.REPLACE_EXISTING);
            logger.info("Tải thành công audio {}", audioPath.getFileName());
        } catch (Exception e) {
            logger.error("Lỗi khi tải audio {}: {}", audioUrl, e.getMessage(), e);
            throw e;
        }
        // 3. Tạo file text chứa danh sách ảnh cho ffmpeg
        Path listFile = tempDir.resolve("images.txt");
        logger.info("Tạo file danh sách ảnh cho ffmpeg: {}", listFile.toAbsolutePath());
        try (BufferedWriter writer = Files.newBufferedWriter(listFile)) {
            for (int i = 0; i < imageUrls.size(); i++) {
                writer.write("file 'img" + String.format("%03d", i) + ".jpg'\n");
            }
            logger.info("Tạo thành công file images.txt");
        } catch (Exception e) {
            logger.error("Lỗi khi tạo file images.txt: {}", e.getMessage(), e);
            throw e;
        }
        // 4. Gọi ffmpeg để tạo video từ ảnh
        Path videoPath = tempDir.resolve("output.mp4");
        String ffmpegCmd = String.format(
            "ffmpeg -y -f concat -safe 0 -i %s -i %s -c:v libx264 -c:a aac -shortest -pix_fmt yuv420p %s",
            listFile.toAbsolutePath(), audioPath.toAbsolutePath(), videoPath.toAbsolutePath()
        );
        logger.info("Chạy lệnh ffmpeg: {}", ffmpegCmd);
        Process process = Runtime.getRuntime().exec(ffmpegCmd);
        int exitCode = process.waitFor();
        if (exitCode != 0) {
            logger.error("ffmpeg thất bại với exit code: {}", exitCode);
            // Đọc stderr để log chi tiết lỗi ffmpeg
            try (BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
                String line;
                while ((line = errorReader.readLine()) != null) {
                    logger.error("ffmpeg: {}", line);
                }
            }
            throw new RuntimeException("ffmpeg failed");
        }
        logger.info("Tạo video thành công: {}", videoPath.toAbsolutePath());
        // Upload lên Cloudinary
        logger.info("Đang upload video lên Cloudinary...");
        String videoUrl;
        try {
            videoUrl = cloudinaryService.uploadVideo(Files.readAllBytes(videoPath), "video/");
            logger.info("Upload thành công. Video url: {}", videoUrl);
        } catch (Exception e) {
            logger.error("Lỗi khi upload video lên Cloudinary: {}", e.getMessage(), e);
            throw e;
        }
        return videoUrl;
    }
} 