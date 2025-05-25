package com.example.conect_database.service;

import com.example.conect_database.Repository.TrendRepository;
import com.example.conect_database.entity.Trend;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

class TrendServiceTest {

    @Mock
    private TrendRepository trendRepository;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private TrendService trendService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testGetAllTrends() {
        // Arrange
        List<Trend> expectedTrends = Arrays.asList(
            new Trend(1L, "Trend1", "Description1", LocalDate.now()),
            new Trend(2L, "Trend2", "Description2", LocalDate.now())
        );
        when(trendRepository.findAll()).thenReturn(expectedTrends);

        // Act
        List<Trend> actualTrends = trendService.getAllTrends();

        // Assert
        assertNotNull(actualTrends);
        assertEquals(expectedTrends.size(), actualTrends.size());
        assertEquals(expectedTrends.get(0).getKeyword(), actualTrends.get(0).getKeyword());
    }

    @Test
    void testFetchTrends() throws Exception {
        // Arrange
        String mockResponse = "{\"trends\":[{\"name\":\"TestTrend\",\"url\":\"http://test.com\"}]}";
        ResponseEntity<String> responseEntity = ResponseEntity.ok(mockResponse);
        
        when(restTemplate.exchange(
            any(String.class),
            eq(HttpMethod.GET),
            any(HttpEntity.class),
            eq(String.class)
        )).thenReturn(responseEntity);

        when(trendRepository.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        // Act
        List<Trend> trends = trendService.fetchTrends();

        // Assert
        assertNotNull(trends);
        assertFalse(trends.isEmpty());
        assertEquals("TestTrend", trends.get(0).getKeyword());
    }
} 