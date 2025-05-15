    package com.example.conect_database.Configuration;



    import com.example.conect_database.dto.request.VerifyRequest;
    import com.example.conect_database.service.AuthenticateService;
    import com.nimbusds.jose.JOSEException;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.beans.factory.annotation.Value;
    import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
    import org.springframework.security.oauth2.jwt.Jwt;
    import org.springframework.security.oauth2.jwt.JwtDecoder;
    import org.springframework.security.oauth2.jwt.JwtException;
    import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
    import org.springframework.stereotype.Component;

    import javax.crypto.spec.SecretKeySpec;
    import java.text.ParseException;
    import java.util.Objects;

    @Component
    public class CustomJwtDecoder implements JwtDecoder {
        @Value("${jwt.signerKey}")
        private String signerKey;

        @Autowired
        private AuthenticateService authenticationService;

        private NimbusJwtDecoder nimbusJwtDecoder = null;

        @Override
        public Jwt decode(String token) throws JwtException {

            try {
                var response = authenticationService.verify(VerifyRequest.builder()// kiểm tra xem token còn hiệu lực hay ko
                        .token(token)
                        .build());

                if (!response.isValid())
                    throw new JwtException("Token invalid");
            } catch (JOSEException | ParseException e) {
                throw new JwtException(e.getMessage());
            }

            if (Objects.isNull(nimbusJwtDecoder)) {// giải mã token
                SecretKeySpec secretKeySpec = new SecretKeySpec(signerKey.getBytes(), "HS512");
                nimbusJwtDecoder = NimbusJwtDecoder
                        .withSecretKey(secretKeySpec)
                        .macAlgorithm(MacAlgorithm.HS512)
                        .build();
            }

            return nimbusJwtDecoder.decode(token);
        }
    }