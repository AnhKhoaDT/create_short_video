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
                "Mỗi phân cảnh cần bao gồm một đoạn mô tả cảnh hoàn chỉnh (ít nhất 3 câu), trong đó kết hợp tự nhiên cả phần mô tả không gian, hành động và lời thoại nhân vật (nếu có). " +
                "Lời thoại phải được nhúng vào mô tả cảnh một cách tự nhiên, ví dụ như 'Lúc này nhân vật nói: \"...\"' hoặc các cách phù hợp khác tùy nội dung cảnh. " +
                "Bên cạnh đó, với mỗi cảnh, viết thêm một dòng 'ImagePrompt: [mô tả chi tiết hình ảnh]' để có thể sinh ra ảnh nền phù hợp. " +
                "Cảnh đầu tiên nên mở đầu bằng một cụm từ dẫn chuyện tự nhiên, mang tính mở đầu như 'Mở đầu câu chuyện', 'Lúc bấy giờ', 'Khi mọi chuyện bắt đầu', hoặc tương đương – nhưng không nên dùng các từ chuyển cảnh như 'Tiếp đến' hay 'Sau đó'. " +
                "Các cảnh tiếp theo nên bắt đầu bằng một từ/cụm từ chuyển cảnh như 'Tiếp đến', 'Sau đó', 'Trong khi đó', 'Lúc này', hoặc tương đương để tạo cảm giác kể chuyện liền mạch. " +
                "Định dạng: Mỗi cảnh bắt đầu bằng 'Scene X:' trên một dòng riêng, tiếp theo là đoạn mô tả cảnh (văn bản liền mạch), và dòng cuối cùng là 'ImagePrompt: [nội dung]'. " +
                "Không sử dụng markdown hay ký hiệu đặc biệt. Không giải thích thêm.",
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
        StringBuilder descriptionBuilder = new StringBuilder();
        String imagePrompt = "";
        boolean inScene = false;
        for (String line : lines) {
            line = line.trim();
            if (line.startsWith("Scene")) {
                // Nếu đang ở trong một scene, lưu lại scene trước đó
                if (inScene) {
                    scenes.add(Scene.builder()
                            .sceneNumber(sceneNumber)
                            .description(descriptionBuilder.toString().trim())                 
                            .imagePrompt(imagePrompt)
                            .build());
                }
                sceneNumber++;
                descriptionBuilder = new StringBuilder();
                imagePrompt = "";
                inScene = true;
            } else if (line.startsWith("ImagePrompt:")) {
                imagePrompt = line.replace("ImagePrompt:", "").trim();
            } else if (!line.isEmpty()) {
                if (descriptionBuilder.length() > 0) descriptionBuilder.append(" ");
                descriptionBuilder.append(line);
            }
        }
        // Thêm scene cuối cùng nếu có
        if (inScene) {
            scenes.add(Scene.builder()
                    .sceneNumber(sceneNumber)
                    .description(descriptionBuilder.toString().trim())
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