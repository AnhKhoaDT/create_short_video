package com.example.conect_database.Controller;

import com.example.conect_database.dto.request.APIRespond;
import com.example.conect_database.entity.Trend;
import com.example.conect_database.service.TrendService;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/trends")
public class TrendController {
    @Autowired
    private TrendService trendService;

    @GetMapping
    public List<Trend> getTrends() throws JsonProcessingException {
        return trendService.fetchTrends(); // Gọi API và lưu dữ liệu
    }
    @GetMapping("all")
    public List<Trend> getAllTrends(){
        return trendService.getAllTrends();
    }
}
