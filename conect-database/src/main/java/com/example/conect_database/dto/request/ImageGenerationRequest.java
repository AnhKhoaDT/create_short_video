package com.example.conect_database.dto.request;

import lombok.experimental.FieldDefaults;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.AccessLevel;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ImageGenerationRequest {
    String scriptContent;
    String scriptCategory;
} 