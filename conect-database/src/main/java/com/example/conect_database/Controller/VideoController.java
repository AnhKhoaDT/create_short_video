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
            List<Video> videos = videoService.fetchAndUpdateAllYouTubeViews();
            List<VideoResponse> response = videos.stream().map(VideoResponse::new).collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<VideoResponse> getVideoById(@PathVariable Long id) {
        try {
            Video video = videoService.getVideoById(id);
            if (video == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(new VideoResponse(video));
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/{id}/subtitle-vtt")
    public ResponseEntity<String> getSubtitleVtt(@PathVariable Long id) {
        try {
            Video video = videoService.getVideoById(id);
            if (video == null || video.getSubtitleVttUrl() == null) {
                return ResponseEntity.notFound().build();
            }
            // Tải file VTT từ URL và trả về nội dung
            java.net.URL url = new java.net.URL(video.getSubtitleVttUrl());
            try (java.io.BufferedReader reader = new java.io.BufferedReader(
                    new java.io.InputStreamReader(url.openStream(), java.nio.charset.StandardCharsets.UTF_8))) {
                StringBuilder vttContent = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    vttContent.append(line).append("\n");
                }
                return ResponseEntity.ok()
                        .header("Content-Type", "text/vtt; charset=UTF-8")
                        .body(vttContent.toString());
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error reading VTT file: " + e.getMessage());
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

    @PutMapping("/{id}/meta")
    public ResponseEntity<VideoResponse> updateVideoMeta(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String title = body.getOrDefault("title", "");
            String description = body.getOrDefault("description", "");
            Video updated = videoService.updateVideoMeta(id, title, description);
            return ResponseEntity.ok(new VideoResponse(updated));
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @PutMapping("/{id}/youtube-status")
    public ResponseEntity<VideoResponse> updateYouTubeStatus(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            boolean youtubeUploaded = (Boolean) body.getOrDefault("youtubeUploaded", false);
            String youtubeUrl = body.get("youtubeUrl") != null ? body.get("youtubeUrl").toString() : null;
            Video updated = videoService.updateYouTubeStatus(id, youtubeUploaded, youtubeUrl);
            return ResponseEntity.ok(new VideoResponse(updated));
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

   

    @GetMapping("/{id}/youtube-view")
    public ResponseEntity<VideoResponse> fetchAndUpdateYouTubeView(@PathVariable Long id) {
        try {
            Video video = videoService.fetchAndUpdateYouTubeView(id);
            return ResponseEntity.ok(new VideoResponse(video));
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
} 