package com.example.conect_database.Controller;

import com.example.conect_database.entity.User;
import com.example.conect_database.enums.Role;
import com.example.conect_database.Repository.UserRepository;
import com.example.conect_database.service.AuthenticateService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.view.RedirectView;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpSession;

@RestController
@RequiredArgsConstructor
public class AuthController {
    @Value("${google.client-id}")
    private String clientId;
    @Value("${google.client-secret}")
    private String clientSecret;

    private final String redirectUri = "http://localhost:8080/create-video-service/oauth2callback";
    private final UserRepository userRepository;
    private final AuthenticateService authenticateService;

    @GetMapping("/auth/google")
    public RedirectView getGoogleAuthUrl(@RequestParam(value = "redirect", defaultValue = "login") String redirect, HttpSession session) {
        session.setAttribute("oauth_redirect", redirect);
        // Thêm scope youtube.upload
        String authUrl = "https://accounts.google.com/o/oauth2/auth?client_id=" + clientId
                + "&redirect_uri=" + redirectUri
                + "&scope=openid%20email%20profile%20https://www.googleapis.com/auth/youtube.upload"
                + "&response_type=code&access_type=offline&prompt=consent";
        return new RedirectView(authUrl);
    }

    @GetMapping("/oauth2callback")
    public RedirectView oauth2callback(@RequestParam("code") String code, HttpSession session) throws Exception {
        System.out.println("[AuthController] Nhận callback với code: " + code);
        try {
            // 1. Đổi code lấy access token
            HttpClient client = HttpClient.newHttpClient();
            String body = "code=" + code
                    + "&client_id=" + clientId
                    + "&client_secret=" + clientSecret
                    + "&redirect_uri=" + redirectUri
                    + "&grant_type=authorization_code";
            System.out.println("[AuthController] Gửi request lấy access token...");
            HttpRequest tokenRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://oauth2.googleapis.com/token"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> tokenResponse = client.send(tokenRequest, HttpResponse.BodyHandlers.ofString());
            System.out.println("[AuthController] Token response: " + tokenResponse.body());
            Map<String, Object> tokenMap = new ObjectMapper().readValue(tokenResponse.body(), Map.class);
            String accessToken = (String) tokenMap.get("access_token");

            // 2. Lấy thông tin user Google
            System.out.println("[AuthController] Gửi request lấy user info...");
            HttpRequest userInfoRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://www.googleapis.com/oauth2/v2/userinfo"))
                    .header("Authorization", "Bearer " + accessToken)
                    .build();
            HttpResponse<String> userInfoResponse = client.send(userInfoRequest, HttpResponse.BodyHandlers.ofString());
            System.out.println("[AuthController] User info response: " + userInfoResponse.body());
            Map<String, Object> userInfo = new ObjectMapper().readValue(userInfoResponse.body(), Map.class);
            String email = (String) userInfo.get("email");
            String name = (String) userInfo.get("name");

            // 3. Kiểm tra user, nếu chưa có thì tạo mới
            User user = userRepository.findByUsername(email).orElse(null);
            if (user == null) {
                user = User.builder()
                        .username(email)
                        .email(email)
                        .password("") // Google user không cần password
                        .roles(new HashSet<>(Set.of(Role.USER)))
                        .build();
                user = userRepository.save(user);
            }

            // 4. Sinh JWT thật
            String jwt = authenticateService.authenticateGoogle(user);

            // 5. Redirect về frontend kèm token và accessToken Google
            String redirect = (String) session.getAttribute("oauth_redirect");
            String frontendUrl;
            if ("preview".equals(redirect)) {
                frontendUrl = "http://localhost:5500/frontend/google-oauth-success.html?token=" + jwt + "&googleAccessToken=" + accessToken;
            } else {
                frontendUrl = "http://localhost:5500/frontend/login.html?token=" + jwt;
            }
            System.out.println("[AuthController] Redirect về frontend: " + frontendUrl);
            return new RedirectView(frontendUrl);
        } catch (Exception e) {
            System.out.println("[AuthController] Lỗi xác thực Google: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
} 