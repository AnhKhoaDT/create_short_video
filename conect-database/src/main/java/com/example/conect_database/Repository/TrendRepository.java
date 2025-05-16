package com.example.conect_database.Repository;

import com.example.conect_database.entity.Trend;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrendRepository extends JpaRepository<Trend, String> {
}
