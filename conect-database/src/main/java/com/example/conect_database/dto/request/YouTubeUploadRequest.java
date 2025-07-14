package com.example.conect_database.dto.request;

import lombok.Data;

@Data
public class YouTubeUploadRequest {
    private String videoUrl;
    private String title;
    private String description;
} 