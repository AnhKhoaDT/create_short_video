package com.example.conect_database.service;
import com.example.conect_database.dto.reponse.TrendResponse;
import com.example.conect_database.entity.Trend;
import com.example.conect_database.Repository.TrendRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import jakarta.annotation.PostConstruct;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TrendService {

    @org.springframework.beans.factory.annotation.Value("${google.api-key}")
    private String apiKey;

    @Autowired
    private TrendRepository trendRepository;

    private RestTemplate restTemplate;
    private ObjectMapper objectMapper;
    private static final String MODEL_NAME = "gemini-2.0-flash";
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL_NAME + ":generateContent";

    @PostConstruct
    public void init() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public TrendResponse getGeminiSuggestions(String keyword, String industry) {
        try {
            String prompt = String.format(
                    "Là một chuyên gia về xu hướng tại Việt Nam, hãy đề xuất 10 chủ đề hấp dẫn về '%s' " +
                            "trong ngành '%s' đang thịnh hành năm 2025. Ưu tiên chủ đề viral trên TikTok/Facebook. " +
                            "Mỗi chủ đề ngắn gọn (3-7 từ). Định dạng: mỗi dòng bắt đầu bằng '-'. Không giải thích thêm.",
                    keyword, industry
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();
            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> contentMap = new HashMap<>();
            List<Map<String, String>> parts = new ArrayList<>();
            Map<String, String> part = new HashMap<>();
            part.put("text", prompt);
            parts.add(part);
            contentMap.put("parts", parts);
            contents.add(contentMap);
            requestBody.put("contents", contents);

            String url = GEMINI_API_URL + "?key=" + apiKey;
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            String response = restTemplate.postForObject(url, request, String.class);

            JsonNode root = objectMapper.readTree(response);
            String responseText = root.path("candidates")
                    .get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();

            List<String> suggestions = parseAPIResponse(responseText);
            List<Trend> savedTrends = saveTrendsToDatabase(suggestions, keyword, industry);

            String responseMessage = String.format("Successfully generated %d suggestions for %s in %s",
                    suggestions.size(), keyword, industry);
            return new TrendResponse("success", responseMessage, savedTrends, suggestions);

        } catch (Exception e) {
            log.error("Gemini API error: {}", e.getMessage());
            return new TrendResponse("error", "Failed to call Gemini API: " + e.getMessage(), null, null);
        }
    }

    private List<String> parseAPIResponse(String response) {
        if (response == null || response.isEmpty()) {
            return new ArrayList<>();
        }
        return Arrays.stream(response.split("\n"))
                .filter(line -> line.trim().startsWith("-"))
                .map(line -> line.replaceFirst("^-\\s*", "").trim())
                .filter(line -> !line.isEmpty())
                .collect(Collectors.toList());
    }

    private List<Trend> saveTrendsToDatabase(List<String> suggestions, String keyword, String industry) {
        List<Trend> trends = suggestions.stream()
                .map(suggestion -> Trend.builder()
                        .keyword(suggestion)
                        .industry(industry)
                        .status("active")
                        .created_at(LocalDate.now())
                        .updated_at(LocalDate.now())
                        .build())
                .collect(Collectors.toList());
        
        return trendRepository.saveAll(trends);
    }

    public List<Trend> getTrendsByIndustry(String industry) {
        return trendRepository.findByIndustry(industry);
    }

    public List<Trend> getTrendsByStatus(String status) {
        return trendRepository.findByStatus(status);
    }

    public Trend updateTrendStatus(String id, String status) {
        Trend trend = trendRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trend not found with id: " + id));
        trend.setStatus(status);
        trend.setUpdated_at(LocalDate.now());
        return trendRepository.save(trend);
    }

    public void deleteTrend(String id) {
        trendRepository.deleteById(id);
    }
}