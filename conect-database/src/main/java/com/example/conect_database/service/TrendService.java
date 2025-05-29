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
    private static final int MAX_TRENDS = 10;
    @PostConstruct
    public void init() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public TrendResponse getGeminiSuggestions() {
        try {
            String keyword = "tất cả";
            String industry = "đa ngành";

            String prompt = String.format(
                    "Là một chuyên gia về xu hướng tại Việt Nam, hãy đề xuất 10 chủ đề hấp dẫn về '%s' " +
                            "trong ngành '%s' đang thịnh hành năm 2025. Ưu tiên chủ đề viral trên TikTok/Facebook. " +
                            "Mỗi chủ đề ngắn gọn (3-7 từ) và kèm theo một câu giải thích ngắn (dưới 15 từ). " +
                            "Định dạng: mỗi dòng bắt đầu bằng '-' theo sau là Chủ đề: Giải thích. Không giải thích thêm.",
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

            List<Map<String, String>> suggestionsWithDescriptions = parseAPIResponse(responseText);


            trendRepository.deleteAll(); // Keep or remove based on your requirements


            // Giới hạn số lượng xu hướng lưu vào cơ sở dữ liệu
            List<Map<String, String>> limitedSuggestions = suggestionsWithDescriptions.stream()
                    .limit(MAX_TRENDS)
                    .collect(Collectors.toList());

            List<Trend> savedTrends = saveTrendsToDatabase(suggestionsWithDescriptions, keyword, industry);

            String responseMessage = String.format("Successfully generated %d suggestions for %s in %s",
                    suggestionsWithDescriptions.size(), keyword, industry);
            // In TrendResponse, the list field likely expects List<Trend>, not List<Map<String, String>>
            // You might need to adjust TrendResponse or how you set the list here.
            // Assuming TrendResponse can hold List<Trend>
            return new TrendResponse("success", responseMessage, savedTrends, null); // suggestions list might be null or adjusted

        } catch (Exception e) {
            log.error("Gemini API error: {}", e.getMessage());
            return new TrendResponse("error", "Failed to call Gemini API: " + e.getMessage(), null, null);
        }
    }

    // Modified to parse both topic and description
    private List<Map<String, String>> parseAPIResponse(String response) {
        List<Map<String, String>> results = new ArrayList<>();
        if (response == null || response.isEmpty()) {
            return results;
        }
        String[] lines = response.split("\n");
        for (String line : lines) {
            String trimmedLine = line.trim();
            if (trimmedLine.startsWith("-")) {
                String content = trimmedLine.replaceFirst("^-\s*", "");
                int colonIndex = content.indexOf(":");
                if (colonIndex != -1) {
                    String topic = content.substring(0, colonIndex).trim();
                    String description = content.substring(colonIndex + 1).trim();
                    if (!topic.isEmpty() && !description.isEmpty()) {
                        Map<String, String> item = new HashMap<>();
                        item.put("topic", topic);
                        item.put("description", description);
                        results.add(item);
                    }
                } else if (!content.isEmpty()) { // Handle cases where no colon is present, use content as topic
                     Map<String, String> item = new HashMap<>();
                     item.put("topic", content);
                     item.put("description", ""); // No description available
                     results.add(item);
                }
            }
        }
        return results;
    }

    // Modified to save description (into status field for now)
    private List<Trend> saveTrendsToDatabase(List<Map<String, String>> suggestionsWithDescriptions, String keyword, String industry) {
        List<Trend> trends = suggestionsWithDescriptions.stream()
                .map(item -> Trend.builder()
                        .keyword(item.get("topic"))
                        .industry(industry)
                        .description(item.get("description")) // Saving description into the status field
                        .created_at(LocalDate.now())
                        .updated_at(LocalDate.now())
                        .build())
                .collect(Collectors.toList());
        
        return trendRepository.saveAll(trends);
    }

    public List<Trend> getTrendsByIndustry(String industry) {
        // This method might need adjustment if you now rely on description instead of industry for filtering
        return trendRepository.findByIndustry(industry);
    }

   


    public void deleteTrend(String id) {
        trendRepository.deleteById(id);
    }
}