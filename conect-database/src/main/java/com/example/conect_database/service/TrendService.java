package com.example.conect_database.service;


import com.example.conect_database.Repository.TrendRepository;
import com.example.conect_database.entity.Trend;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
@Service
@Slf4j
public class TrendService {
    @Autowired
    private TrendRepository trendRepository;
    private final String API_URL = "https://api.x.com/2/trends/place";
    private final String AUTH = "Bearer YOUR_X_BEARER_TOKEN"; // Thay bằng token thực tế

    public List<Trend> fetchTrends() throws JsonProcessingException {
        RestTemplate restTemplate = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", AUTH);

        HttpEntity<String> entity = new HttpEntity<>(headers);
        ResponseEntity<String> response = restTemplate.exchange(
                API_URL + "?id=23424976", // WOEID của Vietnam
                HttpMethod.GET, entity, String.class
        );
        String responseBody = response.getBody();

        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(responseBody);
        JsonNode trends = root.path("trends"); // Cấu trúc JSON của X API

        List<Trend> trendList = new ArrayList<>();
        for (JsonNode item : trends) {
            Trend trend = new Trend();
            trend.setKeyword(item.path("name").asText()); // Trường "name" trong JSON của X
            trend.setDescription(item.path("url").asText()); // Hoặc trường khác tùy API
            trend.setCreated_at(LocalDate.from(LocalDateTime.now()));
            trendList.add(trend);
        }

        return trendRepository.saveAll(trendList);
    }

    public List<Trend> getAllTrends() {
        return trendRepository.findAll();
    }
}