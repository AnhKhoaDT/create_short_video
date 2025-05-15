package com.example.conect_database.Mapper;

import com.example.conect_database.dto.reponse.UserResponse;
import com.example.conect_database.dto.request.UserCreationRequest;
import com.example.conect_database.dto.request.UserUpdateRequest;
import com.example.conect_database.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")// dùng để báo cho nó biết mình dùng trong spring
public interface UserMapper {

    User toUser(UserCreationRequest request);// thêm vào service để sử dụng
    UserResponse toUserResponse(User user);
    void userUpdate(@MappingTarget User user, UserUpdateRequest request);// map user updaterequire vaào user
}
