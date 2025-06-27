package com.example.conect_database.service;

import com.example.conect_database.entity.Script;
import com.example.conect_database.entity.Scene;
import com.example.conect_database.Repository.ScriptRepository;
import com.example.conect_database.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.URL;
import java.nio.file.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VideoService {
    private final ScriptRepository scriptRepository;
    private final CloudinaryService cloudinaryService;

    public String generateVideoFromScript(Long scriptId) throws Exception {
        Script script = scriptRepository.findById(scriptId)
                .orElseThrow(() -> new RuntimeException("Script not found"));
        String audioUrl = script.getAudioUrl();
        List<String> imageUrls = script.getScenes().stream()
                .map(Scene::getImageUrl) // Đảm bảo Scene có trường imageUrl
                .collect(Collectors.toList());

        // 1. Tải ảnh về thư mục tạm
        Path tempDir = Files.createTempDirectory("video-gen");
        for (int i = 0; i < imageUrls.size(); i++) {
            try (InputStream in = new URL(imageUrls.get(i)).openStream()) {
                Files.copy(in, tempDir.resolve(String.format("img%03d.jpg", i)), StandardCopyOption.REPLACE_EXISTING);
            }
        }
        // 2. Tải audio về
        Path audioPath = tempDir.resolve("audio.mp3");
        try (InputStream in = new URL(audioUrl).openStream()) {
            Files.copy(in, audioPath, StandardCopyOption.REPLACE_EXISTING);
        }
        // 3. Tạo file text chứa danh sách ảnh cho ffmpeg
        Path listFile = tempDir.resolve("images.txt");
        try (BufferedWriter writer = Files.newBufferedWriter(listFile)) {
            for (int i = 0; i < imageUrls.size(); i++) {
                writer.write("file 'img" + String.format("%03d", i) + ".jpg'\n");
            }
        }
        // 4. Gọi ffmpeg để tạo video từ ảnh
        Path videoPath = tempDir.resolve("output.mp4");
        String ffmpegCmd = String.format(
            "ffmpeg -y -f concat -safe 0 -i %s -i %s -c:v libx264 -c:a aac -shortest -pix_fmt yuv420p %s",
            listFile.toAbsolutePath(), audioPath.toAbsolutePath(), videoPath.toAbsolutePath()
        );
        Process process = Runtime.getRuntime().exec(ffmpegCmd);
        int exitCode = process.waitFor();
        if (exitCode != 0) throw new RuntimeException("ffmpeg failed");
        // Upload lên Cloudinary
        String videoUrl = cloudinaryService.uploadVideo(Files.readAllBytes(videoPath), "video/");
        return videoUrl;
    }
} 