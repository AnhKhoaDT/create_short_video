package com.example.conect_database.Controller;


import com.example.conect_database.service.SuggestTrendService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/suggest")
public class SuggestTrendController {

    @Autowired
    private SuggestTrendService suggestTrendService;

    @GetMapping
    public ResponseEntity<List<String>> getSuggestions(
            @RequestParam String q,
            @RequestParam(defaultValue = "web") String type
    ) {
        try {
            List<String> suggestions = suggestTrendService.getSuggestions(q, type);
            return ResponseEntity.ok(suggestions);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}