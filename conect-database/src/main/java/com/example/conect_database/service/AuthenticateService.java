package com.example.conect_database.service;

import com.example.conect_database.Repository.InValidatedRepository;
import com.example.conect_database.Repository.UserRepository;
import com.example.conect_database.dto.reponse.AuthenticateReponse;
import com.example.conect_database.dto.reponse.VerifyResponse;
import com.example.conect_database.dto.request.AuthenticateRequest;
import com.example.conect_database.dto.request.LogoutRequest;
import com.example.conect_database.dto.request.RefreshRequest;
import com.example.conect_database.dto.request.VerifyRequest;
import com.example.conect_database.entity.InValidatedToken;
import com.example.conect_database.entity.User;
import com.example.conect_database.exception.AppException;
import com.example.conect_database.exception.ErrorCode;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Objects;
import java.util.StringJoiner;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.CollectionUtils;


@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticateService {
    private final InValidatedRepository inValidatedRepository;
    @NonFinal
    @Value("${jwt.signerKey}")// đọc giá trị trong file
    protected String SIGNER_KEY ;

    @NonFinal
    @Value("${jwt.valid-duration}")// đọc giá trị trong file
    protected long VALID_DURATION ;

    @NonFinal
    @Value("${jwt.refreshable-duration}")// đọc giá trị trong file
    protected long REFRESHABLE_DURATION ;

    private static final Logger logger = LoggerFactory.getLogger(AuthenticateService.class);

    UserRepository userRepository;
    PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

    public VerifyResponse verify(VerifyRequest request) throws JOSEException, ParseException {
        var token = request.getToken();
        boolean isValid = true;
        try {
            verifyToken(token, false);
        }catch (AppException e){
           isValid = false;
        }
        return VerifyResponse.builder()
                .valid(isValid)
                .build();
    }

    public AuthenticateReponse authenticate(AuthenticateRequest request) {
        var user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPassword());

        if (!authenticated) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }else{

            var token = generatedToken(user);
            return AuthenticateReponse.builder()
                    .token(token)
                    .authenticated(true)
                    .build();
        }
    }

    public void logout(LogoutRequest request) throws ParseException, JOSEException {
        try{
        var signToken = verifyToken(request.getToken(), true);
        String jti = signToken.getJWTClaimsSet().getJWTID();
        Date expirationDate = signToken.getJWTClaimsSet().getExpirationTime();

        InValidatedToken invalidatedToken = InValidatedToken.builder()
                .jwtID(jti)
                .expiryTime(expirationDate)
                .build();

        inValidatedRepository.save(invalidatedToken);
        }catch (AppException e){
            logger.info("Token already expired");
        }
    }

    private SignedJWT verifyToken(String token, boolean isRefresh) throws JOSEException, ParseException {
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());

        SignedJWT signedJWT = SignedJWT.parse(token);

        Date expiryTime = (isRefresh)
                ? new Date(signedJWT.getJWTClaimsSet().getIssueTime().toInstant()
                .plus(REFRESHABLE_DURATION, ChronoUnit.SECONDS).toEpochMilli())
                :signedJWT.getJWTClaimsSet().getExpirationTime();
        var verified = signedJWT.verify(verifier);

        if(!(verified && expiryTime.after(new Date()))){// nêú chữ ký ko đúng hay hết hạn
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        if(inValidatedRepository.existsById(signedJWT.getJWTClaimsSet().getJWTID())){
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return signedJWT;

    }

    public AuthenticateReponse refreshToken(RefreshRequest request) throws ParseException, JOSEException {
        var signJWT = verifyToken(request.getToken(), true);
        String jti = signJWT.getJWTClaimsSet().getJWTID();
        Date expirationDate = signJWT.getJWTClaimsSet().getExpirationTime();

        InValidatedToken invalidatedToken = InValidatedToken.builder()
                .jwtID(jti)
                .expiryTime(expirationDate)
                .build();

        inValidatedRepository.save(invalidatedToken);

        // lấy username
        var username = signJWT.getJWTClaimsSet().getSubject();
        var user = userRepository.findByUsername(username).orElseThrow(() ->
                new AppException(ErrorCode.USER_NOT_EXISTED));

        var token = generatedToken(user);
        return AuthenticateReponse.builder()
                .token(token)
                .authenticated(true)
                .build();


    }


    private String generatedToken(User user) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getUsername())
                .issueTime(new Date())
                .issuer("anhkhoa.com")
                .expirationTime(new Date(
                        Instant.now().plus(VALID_DURATION, ChronoUnit.SECONDS).toEpochMilli()
                ))
                .jwtID(UUID.randomUUID().toString())
                .claim("scope", buildScope(user))
                .claim("email", user.getEmail())
                .claim("phone", user.getPhone())
                .claim("dateOfBirth", user.getDob() != null ? user.getDob().toString() : null)
                .build();

        Payload payload = new Payload(jwtClaimsSet.toJSONObject());
        JWSObject jwsObject = new JWSObject(header, payload);//tạo

        try {
            logger.debug("Signing JWT with secret key.");
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            String token = jwsObject.serialize();
            logger.debug("Signed JWT token: {}", token);

            return jwsObject.serialize();
        }catch (JOSEException e){
            logger.error("Error while signing JWT token: {}", e.getMessage(), e);
            throw new RuntimeException(e);
        }
    }

    private String buildScope(User user) {
        StringJoiner stringJoiner = new StringJoiner(" ");
        if(!CollectionUtils.isEmpty(user.getRoles())) {
            user.getRoles().forEach(role -> stringJoiner.add(role.name()));
        }
        return stringJoiner.toString();
    }
}
