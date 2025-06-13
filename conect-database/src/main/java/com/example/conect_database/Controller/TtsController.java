package com.example.conect_database.Controller;

import com.example.conect_database.service.TtsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/tts")
public class TtsController {

    @Autowired
    private TtsService ttsService;

    public static class TtsRequest {
        private String text;
        private int speakerIdx;

        public String getText() { return text; }
        public void setText(String text) { this.text = text; }

        public int getSpeakerIdx() { return speakerIdx; }
        public void setSpeakerIdx(int speakerIdx) { this.speakerIdx = speakerIdx; }
    }

    @PostMapping
    public ResponseEntity<Resource> convertTextToSpeech(@RequestBody TtsRequest request) {
        try {
            Resource audio = ttsService.synthesizeSpeech(request.getText(), request.getSpeakerIdx());
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"voice.wav\"")
                    .contentType(MediaType.parseMediaType("audio/wav"))
                    .body(audio);
        } catch (IOException | InterruptedException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}
