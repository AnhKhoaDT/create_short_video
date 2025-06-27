package com.example.conect_database.Controller;

import com.example.conect_database.service.VideoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/videos")
@RequiredArgsConstructor
public class VideoController {
    private final VideoService videoService;

    @PostMapping("/generate")
    public ResponseEntity<String> generateVideo(@RequestBody Map<String, Long> body) {
        Long scriptId = body.get("scriptId");
        try {
            String videoPath = videoService.generateVideoFromScript(scriptId);
            return ResponseEntity.ok(videoPath);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }
} 