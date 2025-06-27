package com.example.conect_database.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "videos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Video {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "script_id", nullable = false)
    private Script script;

    @Column(columnDefinition = "TEXT")
    private String videoUrl;

    @Column(name = "created_at", columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    @ManyToMany
    @JoinTable(
        name = "video_images",
        joinColumns = @JoinColumn(name = "video_id"),
        inverseJoinColumns = @JoinColumn(name = "image_id")
    )
    private Set<Image> images = new HashSet<>();
} 