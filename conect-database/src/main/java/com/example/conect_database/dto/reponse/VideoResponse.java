package com.example.conect_database.dto.reponse;

import com.example.conect_database.entity.Video;

public class VideoResponse {
    public Long id;
    public String videoUrl;
    public String title;
    public String description;
    public Long scriptId;
    public String subtitleVttUrl;
    public boolean youtubeUploaded;
    public String youtubeUrl;
    public int youtubeViewCount;
    public int viewCountYoutube;

    public VideoResponse(Video video) {
        this.id = video.getId();
        this.videoUrl = video.getVideoUrl();
        this.title = video.getTitle();
        this.description = video.getDescription();
        this.scriptId = video.getScript() != null ? video.getScript().getId() : null;
        this.subtitleVttUrl = video.getSubtitleVttUrl();
        this.youtubeUploaded = video.isYoutubeUploaded();
        this.youtubeUrl = video.getYoutubeUrl();
        this.viewCountYoutube = video.getViewCountYoutube();
    }
} 