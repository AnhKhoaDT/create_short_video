package com.example.conect_database.Controller;

import com.example.conect_database.dto.request.APIRespond;
import com.example.conect_database.dto.request.ScriptRequest;
import com.example.conect_database.dto.reponse.ScriptResponse;
import com.example.conect_database.service.ScriptService;
import com.example.conect_database.entity.Script;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/scripts")
@RequiredArgsConstructor
public class ScriptController {

    private final ScriptService scriptService;

    
    @PostMapping("/generate")
    public ResponseEntity<APIRespond<ScriptResponse>> generateScript(@RequestBody ScriptRequest request, @RequestParam(required = false) String createdBy) {
        APIRespond<ScriptResponse> response = scriptService.generateScript(request, createdBy);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/audio-url")
    public ResponseEntity<Script> updateAudioUrl(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String audioUrl = body.get("audioUrl");
        Script updated = scriptService.updateAudioUrl(id, audioUrl);
        return ResponseEntity.ok(updated);
    }

}