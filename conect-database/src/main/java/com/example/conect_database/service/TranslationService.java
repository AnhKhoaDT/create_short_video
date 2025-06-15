package com.example.conect_database.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.List;

@Service
public class TranslationService {

    private static final Logger logger = LoggerFactory.getLogger(TranslationService.class);

    @Value("${openai.api-key}")
    private String openaiApiKey;

    private WebClient openaiWebClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    public void init() {
        logger.info("Initializing OpenAI WebClient");
        this.openaiWebClient = WebClient.builder()
            .baseUrl("https://api.openai.com/v1/")
            .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + openaiApiKey)
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .build();
        logger.info("OpenAI WebClient initialized successfully");
    }

    public String translateText(String text) {
        if (text == null || text.trim().isEmpty()) {
            return text;
        }

        logger.info("Attempting to translate text: {}", text);
        try {
            String requestBody = objectMapper.writeValueAsString(new TranslationRequest(
                "gpt-3.5-turbo", 
                List.of(new Message("user", "Translate the following text to English: " + text))
            ));

            String response = openaiWebClient.post()
                .uri("chat/completions")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

            JsonNode root = objectMapper.readTree(response);
            String translatedText = root.path("choices").get(0).path("message").path("content").asText();
            logger.info("Translated text: {}", translatedText);
            return translatedText;
        } catch (WebClientResponseException e) {
            logger.error("HTTP Error calling OpenAI API: {}: {}", e.getRawStatusCode(), e.getStatusText());
            logger.error("Response Body: {}", e.getResponseBodyAsString());
            return text; // Return original text on error
        } catch (Exception e) {
            logger.error("General Error calling OpenAI API: {}", e.getMessage(), e);
            return text; // Return original text on error
        }
    }

    // Helper classes for OpenAI API request/response
    static class TranslationRequest {
        public String model;
        public List<Message> messages;

        public TranslationRequest(String model, List<Message> messages) {
            this.model = model;
            this.messages = messages;
        }
    }

    static class Message {
        public String role;
        public String content;

        public Message(String role, String content) {
            this.role = role;
            this.content = content;
        }
    }
} 