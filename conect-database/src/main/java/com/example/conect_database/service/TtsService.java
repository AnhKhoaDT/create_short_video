package com.example.conect_database.service;

import org.springframework.core.io.FileSystemResource;
import org.springframework.stereotype.Service;

import java.io.*;

@Service
public class TtsService {
        private static final String PYTHON_PATH = "C:/Users/ADMIN/Desktop/conect-database/conect-database/tts-env/Scripts/python.exe";
    private static final String PYTHON_SCRIPT = "generate_voice.py";
    private static final String OUTPUT_PATH = "output/audio.wav";

    public FileSystemResource synthesizeSpeech(String text, int speakerIdx) throws IOException, InterruptedException {
    ProcessBuilder pb = new ProcessBuilder(
        PYTHON_PATH, PYTHON_SCRIPT, text, OUTPUT_PATH, String.valueOf(speakerIdx)
    );

    pb.directory(new File("C:/Users/ADMIN/Desktop/conect-database/conect-database/tts-env"));
    pb.environment().put("PYTHONIOENCODING", "utf-8");

    Process process = pb.start();

    try (BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()))) {
        String line;
        while ((line = errorReader.readLine()) != null) {
            System.err.println("[Python ERROR] " + line);
        }
    }

    int exitCode = process.waitFor();
    if (exitCode != 0) {
        throw new RuntimeException("TTS process failed");
    }

    return new FileSystemResource(
        new File("C:/Users/ADMIN/Desktop/conect-database/conect-database/tts-env/" + OUTPUT_PATH)
    );
}
}