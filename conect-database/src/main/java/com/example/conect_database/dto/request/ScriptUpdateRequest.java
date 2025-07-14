package com.example.conect_database.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScriptUpdateRequest {
    private String title;
    private List<SceneUpdateRequest> scenes;
} 