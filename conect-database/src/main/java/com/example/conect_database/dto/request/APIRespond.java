package com.example.conect_database.dto.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

@JsonInclude(JsonInclude.Include.NON_NULL)// cái nào null thì sẽ ko kèm theo
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Setter
@Getter
public class APIRespond <T>{
    T data;// dữ liệu trả về
    int code;
    String message;

}
