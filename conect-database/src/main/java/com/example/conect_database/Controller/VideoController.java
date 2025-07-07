package com.example.conect_database.Controller;

import com.example.conect_database.entity.Video;
import com.example.conect_database.service.VideoService;
import com.example.conect_database.dto.reponse.VideoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/videos")
@RequiredArgsConstructor
public class VideoController {
    private final VideoService videoService;

    @PostMapping("/generate")
    public ResponseEntity<VideoResponse> generateVideo(@RequestBody Map<String, Long> body) {
        Long scriptId = body.get("scriptId");
        try {
            Video video = videoService.generateVideoFromScript(scriptId);
            return ResponseEntity.ok(new VideoResponse(video));
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping
    public ResponseEntity<List<VideoResponse>> getAllVideos() {
        try {
            List<Video> videos = videoService.getAllVideos();
            List<VideoResponse> response = videos.stream().map(VideoResponse::new).collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVideo(@PathVariable Long id) {
        try {
            videoService.deleteVideo(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
} 