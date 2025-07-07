package com.example.conect_database.dto.reponse;

import com.example.conect_database.entity.Video;

public class VideoResponse {
    public Long id;
    public String videoUrl;
    public String title;
    public String description;
    public Long scriptId;

    public VideoResponse(Video video) {
        this.id = video.getId();
        this.videoUrl = video.getVideoUrl();
        this.title = video.getTitle();
        this.description = video.getDescription();
        this.scriptId = video.getScript() != null ? video.getScript().getId() : null;
    }
} 