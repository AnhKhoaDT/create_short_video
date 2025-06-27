package com.example.conect_database.Controller;

import com.example.conect_database.dto.request.TtsRequest;
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
    public ResponseEntity<String> convertTextToSpeech(@RequestBody TtsRequest request) {
        try {
            String cloudUrl = ttsService.synthesizeSpeechAndUpload(request.getText(), request.getVoice());
            return ResponseEntity.ok(cloudUrl);
        } catch (IOException | InterruptedException e) {
            System.err.println("Lỗi trong quá trình chuyển văn bản thành giọng nói: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}