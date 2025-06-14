package com.example.conect_database.Controller;

import com.example.conect_database.dto.TtsRequestDTO;
import com.example.conect_database.service.TtsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/tts")
@CrossOrigin(origins = "*")
public class TtsController {

    @Autowired
    private TtsService ttsService;

    @PostMapping("/synthesize")
    public ResponseEntity<Resource> convertTextToSpeech(@RequestBody TtsRequestDTO request) {
        try {
            FileSystemResource audioFile = ttsService.synthesizeSpeech(request.getText(), request.getVoice());
            byte[] audioBytes = audioFile.getInputStream().readAllBytes();
            
            ByteArrayResource resource = new ByteArrayResource(audioBytes);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"voice.mp3\"")
                    .contentType(MediaType.parseMediaType("audio/mp3"))
                    .contentLength(audioBytes.length)
                    .body(resource);
        } catch (IOException | InterruptedException e) {
            System.err.println("Lỗi trong quá trình chuyển văn bản thành giọng nói: " + e.getMessage());
            e.printStackTrace(); // In ra toàn bộ stack trace
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}