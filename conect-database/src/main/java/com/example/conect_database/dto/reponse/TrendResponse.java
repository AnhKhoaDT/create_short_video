package com.example.conect_database.dto.reponse;

import com.example.conect_database.entity.Trend;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrendResponse {
    private String status;
    private String message;
    private List<Trend> data;
    private List<String> suggestions;
} 