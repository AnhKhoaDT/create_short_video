package com.example.conect_database.Controller;

import com.example.conect_database.dto.reponse.AuthenticateReponse;
import com.example.conect_database.dto.reponse.VerifyResponse;
import com.example.conect_database.dto.request.*;
import com.example.conect_database.service.AuthenticateService;
import com.nimbusds.jose.JOSEException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

import java.text.ParseException;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticateController {
    AuthenticateService authenticateService;
    private final RestClient.Builder builder;

    @PostMapping("/log-in")
    APIRespond<AuthenticateReponse> authenticate(@RequestBody AuthenticateRequest request) {
        var result =authenticateService.authenticate(request    );
        return APIRespond.<AuthenticateReponse>builder()
                .data(result)
                .code(200)
                .build();

    }

    @PostMapping("/refresh")
    APIRespond<AuthenticateReponse> authenticate(@RequestBody RefreshRequest request) throws ParseException, JOSEException {
        var result =authenticateService.refreshToken(request);
        return APIRespond.<AuthenticateReponse>builder()
                .data(result)
                .code(200)
                .build();

    }


    @PostMapping("/verify")
    APIRespond<VerifyResponse> authenticate(@RequestBody VerifyRequest request) throws ParseException, JOSEException {
        var result =authenticateService.verify(request);
        return APIRespond.<VerifyResponse>builder()
                .data(result)
                .build();
    }

    @PostMapping("/logout")
    APIRespond<Void> logout(@RequestBody LogoutRequest request) throws ParseException, JOSEException {
        authenticateService.logout(request);
        return APIRespond.<Void>builder()
                .build();

    }


}
