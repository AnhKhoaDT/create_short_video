package com.example.conect_database.Controller;

import com.example.conect_database.dto.request.ImageGenerationRequest;
import com.example.conect_database.service.ImageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/images")
public class ImageController {

    private final ImageService imageService;

    @Autowired
    public ImageController(ImageService imageService) {
        this.imageService = imageService;
    }

    @PostMapping("/generate")
    public ResponseEntity<List<String>> generateImages(@RequestBody ImageGenerationRequest request) {
        String scriptContent = request.getScriptContent();
        String scriptCategory = request.getScriptCategory();

        if (scriptContent == null || scriptContent.trim().isEmpty()) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }

        try {
            List<String> imageUrls = imageService.generateImages(scriptContent, scriptCategory);
            return new ResponseEntity<>(imageUrls, HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Error generating images: " + e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
} 