package com.example.conect_database.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Setter
@Table(name = "scripts")
public class Script {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    @Column(columnDefinition = "TEXT")
    String title;
    @Column(columnDefinition = "TEXT") // Tiêu đề kịch bản
    String category;
    @Column(columnDefinition = "TEXT") // Thể loại (hành động, giải trí, ...)
    String aiModel;         // Mô hình AI sử dụng
    LocalDateTime createdAt;

    @OneToMany(mappedBy = "script", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    List<Scene> scenes;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}