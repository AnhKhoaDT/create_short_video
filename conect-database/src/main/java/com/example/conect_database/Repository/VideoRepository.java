package com.example.conect_database.Repository;

import com.example.conect_database.entity.Video;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VideoRepository extends JpaRepository<Video, Long> {
    // Có thể thêm các phương thức custom nếu cần
} 