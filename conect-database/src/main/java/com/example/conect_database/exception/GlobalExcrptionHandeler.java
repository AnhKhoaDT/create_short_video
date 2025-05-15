package com.example.conect_database.exception;

import com.example.conect_database.dto.request.APIRespond;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
// class này sẽ chịu trách nhiệm xử lý lỗi
public class GlobalExcrptionHandeler {
    @ExceptionHandler(value = Exception.class)// ko phải lỗi cụ thể th vô cái này
    ResponseEntity<APIRespond> handleException(RuntimeException ex){
        APIRespond apiRespond = new APIRespond();
        apiRespond.setMessage(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage());
        apiRespond.setCode(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode());
        return ResponseEntity.badRequest().body(apiRespond);
    }
    @ExceptionHandler(value = AppException.class)// bắt lỗi sai
    ResponseEntity<APIRespond> handleException(AppException ex){
        ErrorCode errorCode = ex.getErrorCode();
        APIRespond apiRespond = new APIRespond();
        apiRespond.setMessage(ex.getMessage());
        apiRespond.setCode(errorCode.getCode());
        return ResponseEntity
                .status(errorCode.getStatusCode())
                .body(apiRespond);
    }

    @ExceptionHandler(value = AccessDeniedException.class)
    ResponseEntity<APIRespond> handleException(AccessDeniedException ex){
        ErrorCode errorCode = ErrorCode.UNAUTHORIZED;

        return ResponseEntity.status(errorCode.getStatusCode()).body(
                APIRespond.builder()
                        .code(errorCode.getCode())
                        .message(errorCode.getMessage())
                        .build()
        );
    }

    @ExceptionHandler(value = MethodArgumentNotValidException.class)// lỗi validation
    ResponseEntity<APIRespond> handleException(MethodArgumentNotValidException ex){
        String enumKey = ex.getFieldError().getDefaultMessage();
        ErrorCode errorCode = ErrorCode.INVALID_KEY;
        try{
            errorCode = ErrorCode.valueOf(enumKey);
        }catch (IllegalArgumentException e){

        }

        APIRespond apiRespond = new APIRespond();
        apiRespond.setMessage(errorCode.getMessage());
        apiRespond.setCode(errorCode.getCode());
        return ResponseEntity.badRequest().body(apiRespond);
    }
}
