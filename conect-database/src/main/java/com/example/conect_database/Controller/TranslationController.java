package com.example.conect_database.Controller;

import com.example.conect_database.service.TranslationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/translate")
public class TranslationController {

    private final TranslationService translationService;

    @Autowired
    public TranslationController(TranslationService translationService) {
        this.translationService = translationService;
    }

    @PostMapping
    public Map<String, String> translate(@RequestBody Map<String, String> request) {
        String textToTranslate = request.get("text");
        String translatedText = translationService.translateText(textToTranslate);
        return Map.of("originalText", textToTranslate, "translatedText", translatedText);
    }
} 