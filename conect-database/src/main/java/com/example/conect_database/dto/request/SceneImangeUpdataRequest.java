package com.example.conect_database.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SceneImangeUpdataRequest {
    private Long sceneId;
    private String imageUrl;
}
