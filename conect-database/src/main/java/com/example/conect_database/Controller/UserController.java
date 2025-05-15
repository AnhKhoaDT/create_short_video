package com.example.conect_database.Controller;

import com.example.conect_database.dto.reponse.UserResponse;
import com.example.conect_database.dto.request.APIRespond;
import com.example.conect_database.dto.request.UserCreationRequest;
import com.example.conect_database.dto.request.UserUpdateRequest;
import com.example.conect_database.entity.User;
import com.example.conect_database.service.UserService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@Slf4j
public class UserController {
    @Autowired
    private UserService userService;

    @PostMapping
    APIRespond<User> createUser(@RequestBody @Valid UserCreationRequest request){
        APIRespond<User> apiRespond = new APIRespond<>();
       // apiRespond.setMessage("User created successfully.");
        apiRespond.setCode(1000);
        apiRespond.setData(userService.createUser(request));
        return apiRespond;

    }
    @GetMapping
    APIRespond<Object> getUser(){
        var authentication = SecurityContextHolder.getContext().getAuthentication();

        log.info("Username : {}", authentication.getName());
        authentication.getAuthorities().forEach(grantedAuthority -> log.info( grantedAuthority.getAuthority() ));
        return APIRespond.builder()
                .data(userService.getUser())
                .build();
    }

    // Lấy user bởi id
    @GetMapping("/{id}")
    UserResponse getUserById(@PathVariable("id") String id){
        return userService.getUserById(id);
    }
    // Lấy thông tin user từ token
    @GetMapping("/myInfo")
    UserResponse getUserById(){
        return userService.userInfo();
    }

    // cập nhật thông tin user
    @PutMapping("/{userId}")
    UserResponse updateUser(@PathVariable("userId") String userId, @RequestBody UserUpdateRequest request){
        return userService.updateUser(userId,request);
    }

    //delete a user
    @DeleteMapping("/{userId}")
    String deleteUser(@PathVariable("userId") String userId){
        userService.deleteUser(userId);
        return "User are deleted.";
    }
}
