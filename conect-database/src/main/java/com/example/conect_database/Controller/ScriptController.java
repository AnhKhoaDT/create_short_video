package com.example.conect_database.Controller;

import com.example.conect_database.dto.request.APIRespond;
import com.example.conect_database.dto.request.ScriptRequest;
import com.example.conect_database.dto.reponse.ScriptResponse;
import com.example.conect_database.service.ScriptService;
import com.example.conect_database.entity.Script;
import com.example.conect_database.dto.request.SceneImangeUpdataRequest;
import com.example.conect_database.dto.request.SceneAudioUpdateRequest;
import com.example.conect_database.dto.request.ScriptUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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

    @PutMapping("/scenes/audio")
    public ResponseEntity<?> updateSceneAudio(@RequestBody List<SceneAudioUpdateRequest> requests) {
        scriptService.updateMultipleSceneAudioUrls(requests);
        return ResponseEntity.ok("Cập nhật url audio cho các scene thành công!");
    }

    @PutMapping("/scenes/images")
    public ResponseEntity<?> updateSceneImages(@RequestBody List<SceneImangeUpdataRequest> requests) {
        scriptService.updateMultipleSceneImageUrls(requests);
        return ResponseEntity.ok("Cập nhật url ảnh cho các scene thành công!");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateScript(@PathVariable Long id, @RequestBody ScriptUpdateRequest request) {
        try {
            scriptService.updateScript(id, request);
            return ResponseEntity.ok("Cập nhật kịch bản thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi khi cập nhật kịch bản: " + e.getMessage());
        }
    }

}