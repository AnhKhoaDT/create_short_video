package com.example.conect_database.Repository;

import com.example.conect_database.entity.Image;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ImageRepository extends JpaRepository<Image, Long> {
    // Có thể thêm các phương thức custom nếu cần
} 