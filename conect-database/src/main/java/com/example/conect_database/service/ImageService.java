package com.example.conect_database.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.PostConstruct;
import org.springframework.web.reactive.function.BodyInserters;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.http.client.MultipartBodyBuilder;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.conect_database.Repository.ImageRepository;
import com.example.conect_database.entity.Image;

@Service
public class ImageService {
    private static final Logger logger = LoggerFactory.getLogger(ImageService.class);

    @Value("${image.api-key}")
    private String imageApiKey;

    @Value("${stable.diffusion.api-url}")
    private String stableDiffusionApiUrl;

    private WebClient webClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final TranslationService translationService;
    private final CloudinaryService  cloudinaryService;

    @Autowired
    private ImageRepository imageRepository;

    @Autowired
    public ImageService(TranslationService translationService, CloudinaryService cloudinaryService) {
        this.translationService = translationService;
        this.cloudinaryService = cloudinaryService;
    }

    @PostConstruct
    public void init() {
        logger.info("Initializing ImageService with API URL: {}", stableDiffusionApiUrl);
        this.webClient = WebClient.builder()
            .defaultHeader("Authorization", "Bearer " + imageApiKey)
            .defaultHeader("Accept", "image/*")
            .codecs(configurer -> configurer
                .defaultCodecs()
                .maxInMemorySize(16 * 1024 * 1024)) // 16MB buffer limit
            .build();
        logger.info("WebClient initialized successfully");
    }

    public List<String> generateImages(String scriptContent, String scriptCategory, String title) {
        logger.info("Starting image generation for category: {} with content length: {}", 
            scriptCategory, scriptContent,title.length());
        
            List<String> imageUrls = new ArrayList<>();

        try {
            // Translate script content and category to English
            String translatedScriptContent = translationService.translateText(scriptContent);
            String translatedScriptCategory = translationService.translateText(scriptCategory);
            String translatedTiltle = translationService.translateText(title);

            // Create prompt
            String promptText = "Create a image from a " + translatedScriptCategory + " video script: " + translatedScriptContent + "tiêu đề" + translatedTiltle;
            
            logger.info("Generated prompt: {}", promptText);

            // Create form data with MultipartBodyBuilder
            MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();
            bodyBuilder.part("prompt", promptText);
            bodyBuilder.part("output_format", "png");
            bodyBuilder.part("width", "1024");
            bodyBuilder.part("height", "1024");
            bodyBuilder.part("steps", "30");
            bodyBuilder.part("seed", "0");

            logger.info("Sending request to Stable Diffusion API with parameters: prompt={}, format=png, width=1024, height=1024", promptText);

            byte[] responseBytes = webClient.post()
                .uri(stableDiffusionApiUrl)
                .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
                .retrieve()
                .bodyToMono(byte[].class)
                .block();

            if (responseBytes != null) {
                logger.info("Received image data with size: {} bytes", responseBytes.length);
                    // Upload to Cloudinary
                    String folder = "image/";
                    String imageUrl = cloudinaryService.uploadImage(responseBytes, folder);
    
                    imageUrls.add(imageUrl);
                    logger.info("Uploaded to Cloudinary: {}", imageUrl);
                } else {
                    logger.error("Received null response from Stable Diffusion API");
                }
        } catch (WebClientResponseException e) {
            logger.error("HTTP Error calling Stable Diffusion API: {}: {}", e.getRawStatusCode(), e.getStatusText());
            String responseBody = e.getResponseBodyAsString();
            logger.error("Response Body: {}", responseBody);
            try {
                JsonNode errorRoot = objectMapper.readTree(responseBody);
                if (errorRoot.has("errors")) {
                    logger.error("API Errors: {}", errorRoot.get("errors").asText());
                }
            } catch (Exception jsonParseE) {
                logger.warn("Could not parse error response body as JSON: {}", jsonParseE.getMessage());
            }
            throw new RuntimeException("Failed to generate images from Stable Diffusion API.", e);
        } catch (Exception e) {
            logger.error("General Error calling Stable Diffusion API: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate images from Stable Diffusion API.", e);
        }

        logger.info("Image generation completed. Total images: {}", imageUrls.size());
        return imageUrls;
    }

    public Image saveImage(Image image) {
        return imageRepository.save(image);
    }

    public List<Image> getAllImages() {
        return imageRepository.findAll();
    }
}
