package com.example.conect_database.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.http.ResponseEntity;
import jakarta.servlet.http.HttpServletRequest;
import com.example.conect_database.dto.request.YouTubeUploadRequest;
import lombok.RequiredArgsConstructor;
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.youtube.YouTube;
import com.google.api.client.http.FileContent;
import com.google.api.services.youtube.model.Video;
import com.google.api.services.youtube.model.VideoSnippet;
import com.google.api.services.youtube.model.VideoStatus;

import java.io.File;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;


@Service
@RequiredArgsConstructor
public class SocietyService {
    // Inject clientId, clientSecret từ application.yaml
    @Value("${google.client-id}")
    private String clientId;

    @Value("${google.client-secret}")
    private String clientSecret;


    public String uploadVideo(String cloudinaryUrl, String title, String description, String accessToken) {
        try {
            System.out.println("[YouTube] Bắt đầu upload với accessToken: " + accessToken);
            System.out.println("[YouTube] Thông tin video: url=" + cloudinaryUrl + ", title=" + title + ", desc=" + description);
            // 1. Download video từ Cloudinary
            URL url = new URL(cloudinaryUrl);
            File tempFile = File.createTempFile("video", ".mp4");
            try (InputStream in = url.openStream()) {
                Files.copy(in, tempFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
            }

            // 2. Tạo credential từ accessToken
            GoogleCredential credential = new GoogleCredential().setAccessToken(accessToken);

            // 3. Khởi tạo YouTube API client
            YouTube youtube = new YouTube.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                JacksonFactory.getDefaultInstance(),
                credential
            ).setApplicationName("YourAppName").build();

            // 4. Tạo metadata video
            Video videoObjectDefiningMetadata = new Video();
            VideoSnippet snippet = new VideoSnippet();
            snippet.setTitle(title);
            snippet.setDescription(description);
            videoObjectDefiningMetadata.setSnippet(snippet);
            VideoStatus status = new VideoStatus();
            status.setPrivacyStatus("public");
            videoObjectDefiningMetadata.setStatus(status);

            // 5. Upload video
            FileContent mediaContent = new FileContent("video/*", tempFile);
            YouTube.Videos.Insert videoInsert = youtube.videos()
                .insert("snippet,status", videoObjectDefiningMetadata, mediaContent);
            Video returnedVideo = videoInsert.execute();

            // 6. Trả về link YouTube
            return "https://www.youtube.com/watch?v=" + returnedVideo.getId();
        } catch (Exception e) {
            e.printStackTrace(); // In stacktrace chi tiết ra console
            System.err.println("[YouTube] Lỗi upload: " + e.getMessage());
            throw new RuntimeException("Upload YouTube thất bại: " + e.getMessage(), e);
        }
    }
}