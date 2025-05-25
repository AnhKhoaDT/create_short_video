package com.example.conect_database.Repository;

import com.example.conect_database.entity.Trend;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrendRepository extends JpaRepository<Trend, String> {
    List<Trend> findByIndustry(String industry);
    List<Trend> findByStatus(String status);
}
