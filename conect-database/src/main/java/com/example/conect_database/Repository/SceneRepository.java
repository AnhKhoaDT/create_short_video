package com.example.conect_database.Repository;

import com.example.conect_database.entity.Scene;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SceneRepository extends JpaRepository<Scene, Long> {
}