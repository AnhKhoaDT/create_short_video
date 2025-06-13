package com.example.conect_database.dto.reponse;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ScriptResponse {
    Long id;
    String title;
    String category;
    String aiModel;
    LocalDateTime createdAt;
    List<SceneResponse> scenes;
}