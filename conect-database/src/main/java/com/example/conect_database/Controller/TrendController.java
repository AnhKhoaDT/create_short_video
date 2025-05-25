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
    public TrendResponse getSuggestions() {
           
        return trendService.getGeminiSuggestions();
    }

    @GetMapping("/industry/{industry}")
    public List<Trend> getTrendsByIndustry(@PathVariable String industry) {
        return trendService.getTrendsByIndustry(industry);
    }

  

    @DeleteMapping("/{id}")
    public void deleteTrend(@PathVariable String id) {
        trendService.deleteTrend(id);
    }
}
