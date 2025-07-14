package com.example.conect_database.Controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.http.ResponseEntity;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor; // Đúng package của Lombok
import com.example.conect_database.dto.request.YouTubeUploadRequest;
import com.example.conect_database.service.SocietyService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@RequestMapping("/youtube")
@RequiredArgsConstructor
public class SocietyController {
    private final SocietyService societyService;
 

    @GetMapping("/auth")
    public ResponseEntity<?> getYouTubeAuthUrl() {
        String clientId = "${google.client-id}"; // Hoặc inject từ @Value
        String redirectUri = "http://localhost:8080/create-video-service/oauth2callback";
        String authUrl = "https://accounts.google.com/o/oauth2/auth?client_id=" + clientId
            + "&redirect_uri=" + redirectUri
            + "&scope=https://www.googleapis.com/auth/youtube.upload"
            + "&response_type=code&access_type=offline&prompt=consent";
        return ResponseEntity.ok(Map.of("authUrl", authUrl));
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadToYouTube(@RequestBody YouTubeUploadRequest requestDto, HttpServletRequest request) {
        // Lấy access token từ header
        String accessToken = request.getHeader("X-Google-Access-Token");
        if (accessToken == null || accessToken.isEmpty()) {
            return ResponseEntity.status(401).body("Chưa xác thực Google OAuth2. Vui lòng đăng nhập Google trước.");
        }
        String youtubeUrl = societyService.uploadVideo(requestDto.getVideoUrl(), requestDto.getTitle(), requestDto.getDescription(), accessToken);
        return ResponseEntity.ok(Map.of("youtubeUrl", youtubeUrl));
    }
}