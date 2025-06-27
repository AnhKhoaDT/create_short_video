package com.example.conect_database.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "images")
public class Image {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false)
    String url; // Link ảnh trên Cloudinary

    String title;
    String description;
    LocalDateTime createdAt;

    // Nếu muốn liên kết với user, bỏ comment dòng dưới
    // String userId;

    @ManyToMany(mappedBy = "images")
    private Set<Video> videos = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
} 