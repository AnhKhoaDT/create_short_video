//package com.example.conect_database.Configuration;
//
//import com.example.conect_database.Repository.UserRepository;
//import com.example.conect_database.entity.User;
//import com.example.conect_database.enums.Role;
//import lombok.AccessLevel;
//import lombok.RequiredArgsConstructor;
//import lombok.experimental.FieldDefaults;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.ApplicationRunner;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
//import org.springframework.security.crypto.password.PasswordEncoder;
//
//import java.util.HashSet;
//
//@Configuration
//@RequiredArgsConstructor
//@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
//@Slf4j
//public class ApplicationInitConfig {
//    PasswordEncoder passwordEncode ;
//
//    @Bean
//    ApplicationRunner  applicationRunner(UserRepository userRepository) {
//        return (args) -> {
//            if(userRepository.findByUsername("appadmin").isEmpty()){
//                var roles = new HashSet<Role>();
//                roles.add(Role.ADMIN);
//
//                User user =User.builder()
//                        .username("appadmin")
//                        .password(passwordEncode.encode("12345678"))
//                        //.roles(roles)
//                        .build();
//
//                userRepository.save(user);
//                log.warn("admin user has been created with name 'appadmin' and password '12345678'");
//            }
//        };
//    }
//
//}
