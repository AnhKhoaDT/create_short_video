package com.example.conect_database.Configuration;

import com.example.conect_database.dto.request.APIRespond;
import com.example.conect_database.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.web.AuthenticationEntryPoint;


import java.io.IOException;

// dùng để bắt lỗi 401
@Slf4j
public class JWTAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, org.springframework.security.core.AuthenticationException authException) throws IOException, ServletException {
        log.info("Handling 401 Unauthorized error for request: {}", request.getRequestURI());
        log.debug("Authentication exception: {}", authException.getMessage(), authException);
        ErrorCode errorCode = ErrorCode.UNAUTHENTICATED;
        response.setStatus(errorCode.getStatusCode().value());

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        APIRespond<?> apiRespond = APIRespond.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();

        ObjectMapper objectMapper = new ObjectMapper();

        response.getWriter().write(objectMapper.writeValueAsString(apiRespond));
        response.flushBuffer();
        log.info("Sent 401 response: {}", apiRespond);
    }
}
