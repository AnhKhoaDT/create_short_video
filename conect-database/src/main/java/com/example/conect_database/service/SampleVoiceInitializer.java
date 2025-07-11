package com.example.conect_database.service;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@Service
public class SampleVoiceInitializer {
    private final TtsService ttsService;
    private static final List<String> VOICE_IDS = List.of("banmai", "thuminh", "leminh", "giahuy", "minhquang", "ngochuyen");
    private static final String SAMPLE_TEXT = "Xin chào bạn, chúc bạn có một ngày mới tốt lành";

    public SampleVoiceInitializer(TtsService ttsService) {
        this.ttsService = ttsService;
    }

    @PostConstruct
    public void initSampleVoices() {
        try {
            Path sampleDir = Path.of("src/main/resources/static/sample-voices");
            Files.createDirectories(sampleDir);
            for (String voiceId : VOICE_IDS) {
                Path audioPath = sampleDir.resolve(voiceId + ".mp3");
                File audioFile = audioPath.toFile();
                if (!audioFile.exists()) {
                    System.out.println("[SampleVoiceInitializer] Chưa có file " + audioFile.getName() + ", tiến hành tạo...");
                    try {
                        String audioUrl = ttsService.synthesizeSpeechAndUpload(SAMPLE_TEXT, voiceId);
                        byte[] audioBytes = TtsService.downloadFile(audioUrl);
                        try (FileOutputStream fos = new FileOutputStream(audioFile)) {
                            fos.write(audioBytes);
                        }
                        System.out.println("[SampleVoiceInitializer] Đã tạo file mẫu: " + audioFile.getName());
                    } catch (Exception e) {
                        System.err.println("[SampleVoiceInitializer] Lỗi tạo file mẫu cho voice " + voiceId + ": " + e.getMessage());
                    }
                } else {
                    System.out.println("[SampleVoiceInitializer] Đã có file mẫu: " + audioFile.getName());
                }
            }
        } catch (Exception e) {
            System.err.println("[SampleVoiceInitializer] Lỗi khởi tạo audio mẫu: " + e.getMessage());
        }
    }
} 