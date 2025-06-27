package com.example.conect_database.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.util.Map;
import java.util.HashMap;
import java.util.*;



@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(
        @Value("${cloudinary.cloud-name}") String cloudName,
        @Value("${cloudinary.api-key}") String apiKey,
        @Value("${cloudinary.api-secret}") String apiSecret
    ) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
            "cloud_name", cloudName,
            "api_key", apiKey,
            "api_secret", apiSecret
        ));
    }

    public String uploadImage(byte[] imageBytes, String folderName) {
        try {
            // Encode thành Base64
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);
            String dataUri = "data:image/png;base64," + base64Image;

            Map<String, Object> options = new HashMap<>();
            options.put("folder", folderName); // VD: "image/"
            options.put("resource_type", "image");

            Map uploadResult = cloudinary.uploader().upload(dataUri, options);

            return uploadResult.get("secure_url").toString();
        } catch (Exception e) {
            throw new RuntimeException("Upload to Cloudinary failed", e);
        }
    }

    // Lấy danh sách URL ảnh trong folder
    public List<String> listAllImagesInFolder(String folderName) {
        try {
            List<String> urls = new ArrayList<>();
            Map<String, Object> params = new HashMap<>();
            params.put("type", "upload");
            params.put("prefix", folderName); // VD: "image/"
            params.put("max_results", 100);
            Map result = cloudinary.api().resources(params);
            List<Map<String, Object>> resources = (List<Map<String, Object>>) result.get("resources");
            for (Map<String, Object> resource : resources) {
                urls.add(resource.get("secure_url").toString());
            }
            return urls;
        } catch (Exception e) {
            throw new RuntimeException("Failed to list images in folder", e);
        }
    }

    // Xóa ảnh theo URL
    public void deleteImageByUrl(String imageUrl) {
        try {
            // Lấy public_id từ url
            String[] parts = imageUrl.split("/");
            String publicIdWithExtension = parts[parts.length - 2] + "/" + parts[parts.length - 1];
            String publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
            Map result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete image from Cloudinary", e);
        }
    }

    public String uploadAudio(byte[] audioBytes, String folderName) {
        try {
            String base64Audio = Base64.getEncoder().encodeToString(audioBytes);
            String dataUri = "data:audio/mp3;base64," + base64Audio;

            Map<String, Object> options = new HashMap<>();
            options.put("folder", folderName); // VD: "audio/"
            options.put("resource_type", "video"); // Cloudinary nhận mp3 là video

            Map uploadResult = cloudinary.uploader().upload(dataUri, options);

            return uploadResult.get("secure_url").toString();
        } catch (Exception e) {
            throw new RuntimeException("Upload audio to Cloudinary failed", e);
        }
    }

    public String uploadVideo(byte[] videoBytes, String folderName) {
        try {
            String base64Video = Base64.getEncoder().encodeToString(videoBytes);
            String dataUri = "data:video/mp4;base64," + base64Video;

            Map<String, Object> options = new HashMap<>();
            options.put("folder", folderName); // VD: "video/"
            options.put("resource_type", "video");

            Map uploadResult = cloudinary.uploader().upload(dataUri, options);

            return uploadResult.get("secure_url").toString();
        } catch (Exception e) {
            throw new RuntimeException("Upload video to Cloudinary failed", e);
        }
    }
}
