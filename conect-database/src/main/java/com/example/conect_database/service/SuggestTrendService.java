package com.example.conect_database.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import lombok.extern.slf4j.Slf4j; // Import Slf4j annotation
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;

import java.util.ArrayList; // Added import for ArrayList for the error case
import java.util.List;
import java.util.Arrays; // Import Arrays

import jakarta.annotation.PostConstruct; // Keep this import

@Service
@Slf4j// Add Slf4j annotation
public class SuggestTrendService {
    private static final Logger logger = LoggerFactory.getLogger(SuggestTrendService.class);

    private RestTemplate restTemplate;

    @PostConstruct
    public void init() {
        this.restTemplate = new RestTemplate();
        // Configure RestTemplate to handle text/javascript for JSON
        List<HttpMessageConverter<?>> messageConverters = new ArrayList<>();
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        converter.setSupportedMediaTypes(Arrays.asList(MediaType.APPLICATION_JSON, MediaType.valueOf("text/json"), MediaType.valueOf("text/javascript")));
        messageConverters.add(converter);
        // Add other default converters if needed, or get existing ones and modify
        // For simplicity, we are just adding our custom converter here. If you had others, add them too.
        this.restTemplate.setMessageConverters(messageConverters);
    }

    public List<String> getSuggestions(String query, String type) {
        String url;

        if ("yt".equalsIgnoreCase(type)) {
            url = "https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=" + query;
        } else {
            url = "https://suggestqueries.google.com/complete/search?client=firefox&q=" + query;
        }

        try {
            // Note: Google Suggest API might return different structures,
            // Object[].class might not always be correct.
            // A more robust approach would involve inspecting the actual response structure.
            Object[] response = restTemplate.getForObject(url, Object[].class);

            @SuppressWarnings("unchecked")
            List<String> suggestions = (List<String>) response[1];
            return suggestions;
        } catch (Exception e) {
            // Log the detailed error with stack trace
            logger.error("Error fetching suggestions from external Google Suggest API for query: {} and type: {}", query, type, e);
            // Re-throwing the exception so the controller knows there was an error
            // You could also return an empty list or null here if you prefer the controller to handle it differently
            throw new RuntimeException("Không thể lấy gợi ý từ nguồn ngoài", e);
        }
    }
}