package com.example.conect_database.Controller;

import com.example.conect_database.dto.reponse.TrendResponse;
import com.example.conect_database.entity.Trend;
import com.example.conect_database.service.TrendService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/trends")
public class TrendController {
    @Autowired
    private TrendService trendService;

    @GetMapping("/suggestions")
    public TrendResponse getSuggestions(
            @RequestParam String keyword,
            @RequestParam String industry) {
        return trendService.getGeminiSuggestions(keyword, industry);
    }

    @GetMapping("/industry/{industry}")
    public List<Trend> getTrendsByIndustry(@PathVariable String industry) {
        return trendService.getTrendsByIndustry(industry);
    }

    @GetMapping("/status/{status}")
    public List<Trend> getTrendsByStatus(@PathVariable String status) {
        return trendService.getTrendsByStatus(status);
    }

    @PutMapping("/{id}/status")
    public Trend updateTrendStatus(
            @PathVariable String id,
            @RequestParam String status) {
        return trendService.updateTrendStatus(id, status);
    }

    @DeleteMapping("/{id}")
    public void deleteTrend(@PathVariable String id) {
        trendService.deleteTrend(id);
    }
}
