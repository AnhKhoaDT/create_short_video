package com.example.conect_database.service;

import com.example.conect_database.dto.request.APIRespond;
import com.example.conect_database.dto.request.ScriptRequest;
import com.example.conect_database.dto.reponse.ScriptResponse;
import com.example.conect_database.dto.reponse.SceneResponse;
import com.example.conect_database.entity.Script;
import com.example.conect_database.entity.Scene;
import com.example.conect_database.Repository.ScriptRepository;
import com.example.conect_database.Repository.SceneRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScriptService {

    private final ScriptRepository scriptRepository;
    private final SceneRepository sceneRepository;

    @Value("${google.api-key}")
    private String apiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    private static final String MODEL_NAME = "gemini-2.0-flash";
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL_NAME + ":generateContent";

    /**
     * Tạo kịch bản dựa trên AI và trả về APIRespond<ScriptResponse>
     */
    public APIRespond<ScriptResponse> generateScript(ScriptRequest request, String createdBy) {
        try {
            // Tạo prompt gửi cho AI
            String prompt = String.format(
                    "Hãy chia kịch bản video ngắn với chủ đề '%s' thuộc thể loại '%s' thành 5 phân cảnh. " +
                            "Mỗi phân cảnh gồm: 1. Mô tả cảnh (1-2 câu); 2. Lời thoại chính (nếu có); 3. Tích hợp mô tả chính của cảnh, viết ít nhất 2 câu miêu tả chi tiết ánh sáng, góc quay, phong cách hình ảnh và các yếu tố đặc biệt, giúp tạo ra hình ảnh sống động và phù hợp với thể loại kịch bản. " +
                            "Định dạng: mỗi cảnh là một khối văn bản với cấu trúc phẳng, bắt đầu bằng 'Scene X:' trên một dòng riêng, tiếp theo là 'Description: [nội dung]' trên dòng riêng, 'Dialogue: [nội dung]' trên dòng riêng (nếu có), 'ImagePrompt: [nội dung]' trên dòng riêng. Không sử dụng dấu * hoặc markdown, chỉ dùng text phẳng. Không giải thích thêm.",
                    request.getInput(), request.getCategory()
            );

            // Thiết lập header Content-Type
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Chuẩn bị body gửi lên Gemini API
            Map<String, Object> requestBody = new HashMap<>();
            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> contentMap = new HashMap<>();
            List<Map<String, String>> parts = new ArrayList<>();
            Map<String, String> part = new HashMap<>();
            part.put("text", prompt);
            parts.add(part);
            contentMap.put("parts", parts);
            contents.add(contentMap);
            requestBody.put("contents", contents);

            // Gọi API Gemini
            String url = GEMINI_API_URL + "?key=" + apiKey;
            HttpEntity<Map<String, Object>> httpRequest = new HttpEntity<>(requestBody, headers);
            String response = restTemplate.postForObject(url, httpRequest, String.class);

            // Parse response JSON
            JsonNode root = objectMapper.readTree(response);
            String responseText = root.path("candidates")
                    .get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();
            
            log.info("AI response: {}", responseText);
            // Parse text thành danh sách các scene
            List<Scene> scenes = parseScenesFromAIResponse(responseText);
            log.info("Parsed scenes: {}", scenes);
            
            // Lấy câu đầu tiên của input làm title
            String input = request.getInput();
            String title = input;
            if (input != null && input.contains(".")) {
                title = input.split("\\.")[0].trim();
            }

            // Tạo entity Script mới và lưu thông tin
            Script script = Script.builder()
                    .title(title)
                    .category(request.getCategory())
                    .aiModel(request.getAiModel())
                    .createdAt(LocalDateTime.now())
                    .build();

            // Thiết lập quan hệ giữa script và scene
            script.setScenes(scenes);
            scenes.forEach(scene -> scene.setScript(script));

            // Lưu script và các scene vào database
            Script savedScript = scriptRepository.save(script);
            sceneRepository.saveAll(scenes);

            ScriptResponse scriptResponse = mapToResponse(savedScript);

            // Trả về APIRespond thành công
            return APIRespond.<ScriptResponse>builder()
                    .data(scriptResponse)
                    .code(0)
                    .message("Tạo kịch bản thành công")
                    .build();

        } catch (Exception e) {
            log.error("AI Script generation error: {}", e.getMessage());
            // Trả về APIRespond lỗi
            return APIRespond.<ScriptResponse>builder()
                    .data(null)
                    .code(9999)
                    .message("Lỗi tạo kịch bản: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Parse kết quả AI trả về thành danh sách các Scene.
     */
    private List<Scene> parseScenesFromAIResponse(String response) {
        List<Scene> scenes = new ArrayList<>();
        // in ra log để kiểm tra response
        log.info("AI response for parsing scenes: {}", response);
        if (response == null || response.isEmpty()) return scenes;

        String[] lines = response.split("\n");
        int sceneNumber = 0;
        String description = "", dialogue = "", imagePrompt = "";
        for (String line : lines) {
            line = line.trim();
            if (line.startsWith("Scene")) {
                // Khi gặp một scene mới, thêm scene trước đó vào danh sách
                if (sceneNumber > 0) {
                    scenes.add(Scene.builder()
                            .sceneNumber(sceneNumber)
                            .description(description)
                            .dialogue(dialogue)
                            .imagePrompt(imagePrompt)
                            .build());
                }
                sceneNumber++;
                description = ""; dialogue = ""; imagePrompt = "";
            } else if (line.startsWith("Description:")) {
                description = line.replace("Description:", "").trim();
            } else if (line.startsWith("Dialogue:")) {
                dialogue = line.replace("Dialogue:", "").trim();
            } else if (line.startsWith("ImagePrompt:")) {
                imagePrompt = line.replace("ImagePrompt:", "").trim();
            }
        }
        // Thêm scene cuối cùng nếu có
        if (sceneNumber > 0) {
            scenes.add(Scene.builder()
                    .sceneNumber(sceneNumber)
                    .description(description)
                    .dialogue(dialogue)
                    .imagePrompt(imagePrompt)
                    .build());
        }
        return scenes;
    }

    /**
     * Chuyển đổi entity Script thành ScriptResponse để trả về client.
     */
    private ScriptResponse mapToResponse(Script script) {
        List<SceneResponse> sceneResponses = script.getScenes().stream()
                .map(scene -> SceneResponse.builder()
                        .sceneNumber(scene.getSceneNumber())
                        .description(scene.getDescription())
                        .dialogue(scene.getDialogue())
                        .imagePrompt(scene.getImagePrompt())
                        .build())
                .collect(Collectors.toList());

        return ScriptResponse.builder()
                .id(script.getId())
                .title(script.getTitle())
                .category(script.getCategory())
                .aiModel(script.getAiModel())
                .createdAt(script.getCreatedAt())
                .scenes(sceneResponses)
                .build();
    }
}