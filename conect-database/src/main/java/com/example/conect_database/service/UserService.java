package com.example.conect_database.service;

import com.example.conect_database.Mapper.UserMapper;
import com.example.conect_database.Repository.UserRepository;
import com.example.conect_database.dto.reponse.UserResponse;
import com.example.conect_database.dto.request.UserCreationRequest;
import com.example.conect_database.dto.request.UserUpdateRequest;
import com.example.conect_database.entity.User;
import com.example.conect_database.enums.Role;
import com.example.conect_database.exception.AppException;
import com.example.conect_database.exception.ErrorCode;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

// this is used to call to repository
@Service
@Setter
@Slf4j
public class UserService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private UserMapper userMapper;
    @Autowired
    PasswordEncoder passwordEncoder;

    public User createUser(UserCreationRequest request){



        if(userRepository.existsByUsername(request.getUsername())){
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        User user = userMapper.toUser(request);// map request vào user
        // tôi muốn băm password

        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // set user mặc định l USER
        Set<Role> roles = new HashSet<>();
        roles.add(Role.USER);
        user.setRoles(roles);

        return userRepository.save(user);
    }
    @PreAuthorize("hasRole('ADMIN')")// kiểm tra trước khi vào method
    public List<User> getUser(){
        return userRepository.findAll();
    }

    // kiểm tra sau khi method dc gọi, có thểkiermem tra user đăng nhập phải là nó hay ko để lấy thông tin
    @PostAuthorize("returnObject.username == authentication.name")
    public UserResponse getUserById(String id) {
        UserResponse userResponse = userMapper.toUserResponse(userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found")));

        log.info("returnObject.username: {}", userResponse.getUsername());
        log.info("authentication.name: {}", SecurityContextHolder.getContext().getAuthentication().getName());

        return userResponse;
    }

    public UserResponse userInfo(){
        var context = SecurityContextHolder.getContext();
        String name = context.getAuthentication().getName();

        User user = userRepository.findByUsername(name).orElseThrow(()-> new AppException(ErrorCode.USER_NOT_EXISTED));
        return userMapper.toUserResponse(user);
    }


    // update user
    public UserResponse updateUser(String userId, UserUpdateRequest request){
        User user = userRepository.findById(userId).orElseThrow(()->new RuntimeException("User not found"));
        userMapper.userUpdate(user, request);

        return userMapper.toUserResponse(userRepository.save(user));
    }

    // delete a user
    public void deleteUser(String userId){
        userRepository.deleteById(userId);
    }

}
