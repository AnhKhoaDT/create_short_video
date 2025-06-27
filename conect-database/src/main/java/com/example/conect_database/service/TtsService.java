package com.example.conect_database.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.beans.factory.annotation.Autowired;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;


@Service
public class TtsService {
    @Value("${fpt.ai.api-key}")
    private String apiKey;
    private static final String API_URL = "https://api.fpt.ai/hmi/tts/v5";
    private static final String OUTPUT_DIR = "output";
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private static final long POLLING_INTERVAL_MS = 2000; // 2 seconds
    private static final int MAX_POLLING_ATTEMPTS = 30; // Max 60 seconds wait

    @Autowired
    private CloudinaryService cloudinaryService;

    public String synthesizeSpeechAndUpload(String text, String voice) throws IOException, InterruptedException {
        // Create output directory if it doesn't exist
        Files.createDirectories(Path.of(OUTPUT_DIR));
        // Loại bỏ dấu " trong text
        text = text.replace("\"", "");
        // Prepare headers
        HttpHeaders headers = new HttpHeaders();
        headers.set("api-key", apiKey);
        headers.set("voice", voice);
        headers.setContentType(new MediaType(MediaType.TEXT_PLAIN, StandardCharsets.UTF_8));
        // In ra body gửi lên FPT.AI
        System.out.println("[TTS] Body gửi lên FPT.AI:");
        System.out.println("text: " + text);
        System.out.println("voice: " + voice);
        // Make initial API request
        RestTemplate restTemplate = new RestTemplate();
        System.out.println("Đang gửi yêu cầu TTS ban đầu đến FPT.AI...");
        ResponseEntity<byte[]> response;
        try {
            response = restTemplate.exchange(
                API_URL,
                HttpMethod.POST,
                new HttpEntity<>(text, headers),
                byte[].class
            );
            System.out.println("Đã nhận được phản hồi ban đầu từ FPT.AI. Status: " + response.getStatusCode());
        } catch (HttpClientErrorException e) {
            System.err.println("Lỗi HTTP client khi gửi yêu cầu ban đầu: " + e.getStatusCode() + " - " + e.getResponseBodyAsString());
            throw new IOException("Lỗi từ FPT.AI API (phản hồi ban đầu): " + e.getResponseBodyAsString(), e);
        } catch (ResourceAccessException e) {
            System.err.println("Lỗi kết nối mạng khi gửi yêu cầu ban đầu: " + e.getMessage());
            throw new IOException("Không thể kết nối đến FPT.AI API. Vui lòng kiểm tra kết nối mạng hoặc URL. Chi tiết: " + e.getMessage(), e);
        }
        byte[] audioBytes = null;
        if (response.getStatusCode() == HttpStatus.OK) {
            // Check Content-Type header to determine if it's audio or JSON
            MediaType contentType = response.getHeaders().getContentType();
            System.out.println("Content-Type của phản hồi ban đầu: " + contentType);
            if (contentType != null && contentType.includes(MediaType.parseMediaType("audio/mp3"))) {
                // Direct audio response
                System.out.println("Phản hồi trực tiếp là audio/mp3.");
                audioBytes = response.getBody();
            } else if (contentType != null && contentType.includes(MediaType.APPLICATION_JSON)) {
                // Asynchronous response, parse JSON to get the audio URL
                JsonNode jsonResponse = objectMapper.readTree(response.getBody());
                System.out.println("Phản hồi ban đầu là JSON: " + jsonResponse.toString());
                if (jsonResponse.has("async")) {
                    String asyncUrl = jsonResponse.get("async").asText();
                    System.out.println("URL bất đồng bộ: " + asyncUrl);
                    System.out.println("⏳ Đang chờ FPT.AI hoàn thành xử lý giọng nói (polling)...");
                    for (int i = 0; i < MAX_POLLING_ATTEMPTS; i++) {
                        Thread.sleep(POLLING_INTERVAL_MS);
                        System.out.println("Đang polling FPT.AI (lần " + (i + 1) + "/" + MAX_POLLING_ATTEMPTS + ")...");
                        try {
                            ResponseEntity<byte[]> audioResponse = restTemplate.getForEntity(asyncUrl, byte[].class);
                            if (audioResponse.getStatusCode() == HttpStatus.OK) {
                                MediaType audioContentType = audioResponse.getHeaders().getContentType();
                                System.out.println("Content-Type của phản hồi polling: " + audioContentType);
                                if (audioContentType != null && (audioContentType.includes(MediaType.parseMediaType("audio/mp3")) || audioContentType.includes(MediaType.parseMediaType("audio/mpeg")))) {
                                    System.out.println("✅ Đã nhận được file âm thanh từ URL bất đồng bộ.");
                                    audioBytes = audioResponse.getBody();
                                    break;
                                } else if (audioContentType != null && audioContentType.includes(MediaType.APPLICATION_JSON)) {
                                    // Still a JSON response, maybe status update or error
                                    JsonNode pollJsonResponse = objectMapper.readTree(audioResponse.getBody());
                                    System.out.println("Trạng thái FPT.AI (lần " + (i + 1) + "): " + pollJsonResponse.toString());
                                    if (pollJsonResponse.has("status") && !"success".equalsIgnoreCase(pollJsonResponse.get("status").asText())) {
                                        System.err.println("FPT.AI báo lỗi trong quá trình polling: " + pollJsonResponse.toString());
                                        throw new IOException("FPT.AI báo lỗi trong quá trình polling: " + pollJsonResponse.toString());
                                    }
                                } else {
                                    System.err.println("Loại nội dung không mong muốn trong khi polling: " + audioContentType);
                                    throw new IOException("Loại nội dung không mong muốn trong khi polling: " + audioContentType);
                                }
                            }
                        } catch (HttpClientErrorException e) {
                            System.err.println("Lỗi HTTP client trong khi polling (lần " + (i + 1) + "): " + e.getStatusCode() + " - " + e.getResponseBodyAsString());
                            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                                System.out.println("URL polling chưa sẵn sàng (404), tiếp tục thử lại...");
                            } else {
                                throw new IOException("Lỗi từ FPT.AI API (polling): " + e.getResponseBodyAsString(), e);
                            }
                        } catch (ResourceAccessException e) {
                            System.err.println("Lỗi kết nối mạng trong khi polling (lần " + (i + 1) + "): " + e.getMessage());
                            throw new IOException("Không thể kết nối đến FPT.AI API trong khi polling. Chi tiết: " + e.getMessage(), e);
                        } catch (Exception e) {
                            System.err.println("Lỗi không mong muốn trong khi polling (lần " + (i + 1) + "): " + e.getMessage());
                            e.printStackTrace();
                            throw new IOException("Lỗi không mong muốn trong quá trình polling: " + e.getMessage(), e);
                        }
                    }
                    if (audioBytes == null) {
                        throw new IOException("Hết thời gian chờ lấy file âm thanh từ FPT.AI API (" + MAX_POLLING_ATTEMPTS * POLLING_INTERVAL_MS / 1000 + " giây).");
                    }
                } else {
                    System.err.println("Phản hồi JSON ban đầu không chứa trường 'async': " + jsonResponse.toString());
                    throw new IOException("Lỗi từ FPT.AI API: Phản hồi JSON không chứa trường 'async'.");
                }
            } else {
                System.err.println("Loại nội dung không mong muốn từ API FPT.AI: " + contentType);
                throw new IOException("Loại nội dung không mong muốn từ API FPT.AI: " + contentType);
            }
        } else {
            System.err.println("API FPT.AI phản hồi với trạng thái lỗi: " + response.getStatusCode() + ". Body: " + new String(response.getBody(), StandardCharsets.UTF_8));
            throw new IOException("API FPT.AI phản hồi với trạng thái lỗi: " + response.getStatusCode() + ". Vui lòng kiểm tra lại API Key hoặc nội dung.");
        }
        // Upload lên Cloudinary
        String cloudUrl = cloudinaryService.uploadAudio(audioBytes, "tts-audio/");
        return cloudUrl;
    }

   
}