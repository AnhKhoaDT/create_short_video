package com.example.conect_database.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "scenes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Scene {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    int sceneNumber;         // Số thứ tự phân cảnh

    @Column(columnDefinition = "TEXT") // Tăng độ dài cho mô tả cảnh
    private String description; // Mô tả cảnh (bối cảnh, hành động)

    @Column(columnDefinition = "TEXT") // Sử dụng TEXT để chứa dữ liệu dài
    private String imagePrompt; // Gợi ý tạo hình ảnh cho cảnh này

    @Column(columnDefinition = "TEXT")
    private String imageUrl; // Link ảnh cho từng cảnh

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "script_id", nullable = false)
    private Script script; // Id của kịch bản (liên kết với Script)
}