package com.example.conect_database.dto.request;
import lombok.*;
import lombok.experimental.FieldDefaults;
@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ScriptRequest {
    String input;
    String category;
    String aiModel;
}