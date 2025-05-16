package com.example.conect_database.service;


import com.example.conect_database.Repository.TrendRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class TrendService {
    @Autowired
    private TrendRepository trendRepository;
    private final String API_URL = "https://api.dataforseo.com/v3/keywords_data/google_trends/explore/live";


}
