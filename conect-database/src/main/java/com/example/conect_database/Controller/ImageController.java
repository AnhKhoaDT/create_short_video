package com.example.conect_database.Controller;

import com.example.conect_database.dto.request.ImageGenerationRequest;
import com.example.conect_database.entity.Image;
import com.example.conect_database.service.ImageService;
import com.example.conect_database.service.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/images")
public class ImageController {

    private final ImageService imageService;
    private final CloudinaryService cloudinaryService;

    @Autowired
    public ImageController(ImageService imageService, CloudinaryService cloudinaryService) {
        this.imageService = imageService;
        this.cloudinaryService = cloudinaryService;
    }

    @PostMapping("/generate")
    public ResponseEntity<List<String>> generateImages(@RequestBody ImageGenerationRequest request) {
        String scriptContent = request.getScriptContent();
        String scriptCategory = request.getScriptCategory();
        String scriptTitle = request.getTitle();

        if (scriptContent == null || scriptContent.trim().isEmpty()) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }

        try {
            List<String> imageUrls = imageService.generateImages(scriptContent, scriptCategory, scriptTitle);
            return new ResponseEntity<>(imageUrls, HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Error generating images: " + e.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("")
    public List<Image> getAllImages() {
        return imageService.getAllImages();
    }

    @PostMapping("save")
    public Image saveImage(@RequestBody Image image) {
        return imageService.saveImage(image);
    }

    @GetMapping("/cloudinary")
    public List<String> getAllCloudinaryImages() {
        return cloudinaryService.listAllImagesInFolder("image/");
    }

    @PostMapping("/delete-by-url")
    public ResponseEntity<?> deleteImageByUrl(@RequestBody Map<String, String> body) {
        String url = body.get("url");
        if (url == null || url.isEmpty()) return ResponseEntity.badRequest().build();
        cloudinaryService.deleteImageByUrl(url);
        return ResponseEntity.ok().build();
    }
} 