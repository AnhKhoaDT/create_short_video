package com.example.conect_database.Controller;

import com.example.conect_database.dto.request.APIRespond;
import com.example.conect_database.dto.request.ScriptRequest;
import com.example.conect_database.dto.reponse.ScriptResponse;
import com.example.conect_database.service.ScriptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

}