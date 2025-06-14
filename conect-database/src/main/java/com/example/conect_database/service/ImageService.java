package com.example.conect_database.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class ImageService {

    @Value("${image.api.key}")
    private String imageApiKey;

    public List<String> generateImages(String scriptContent, String scriptCategory) {
        // Here you would integrate with an actual AI image generation API
        // For demonstration, we'll return placeholder image URLs.
        // In a real application, this would involve making HTTP requests
        // to an external service like DALL-E, Stable Diffusion, etc.
        System.out.println("Generating images for script content: " + scriptContent + " with category: " + scriptCategory);
        System.out.println("Using Image API Key: " + imageApiKey);

        List<String> imageUrls = new ArrayList<>();
        // Simulate generating 4 different images
        // You can use scriptCategory here to influence image generation if your actual API supports it.
        String baseText = scriptContent.substring(0, Math.min(scriptContent.length(), 20));
        imageUrls.add("https://via.placeholder.com/600x400?text=Image+1+for+" + baseText + "+" + scriptCategory);
        imageUrls.add("https://via.placeholder.com/600x400?text=Image+2+for+" + baseText + "+" + scriptCategory);
        imageUrls.add("https://via.placeholder.com/600x400?text=Image+3+for+" + baseText + "+" + scriptCategory);
        imageUrls.add("https://via.placeholder.com/600x400?text=Image+4+for+" + baseText + "+" + scriptCategory);

        return imageUrls;
    }
} 