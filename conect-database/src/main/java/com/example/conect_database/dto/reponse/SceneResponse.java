package com.example.conect_database.dto.reponse;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SceneResponse {
    int sceneNumber;
    String description;
    String dialogue;
    String imagePrompt;
}