package com.example.conect_database.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SceneUpdateRequest {
    private Long id;
    private Integer sceneNumber;
    private String description;
    private String imagePrompt;
} 