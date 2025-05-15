package com.example.conect_database.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserCreationRequest {
    @Size(min = 6, message = "USERNAME_INVALID" )
    private String username;

    @Size(min = 8, message = "Password must be at least 8 characters long" )
    String password;
    //email phải duy nhất
    @Email
    String email;
    // số điện thoại phải duy nhất
    String phone;
    String address;
    LocalDate dob ;

}
