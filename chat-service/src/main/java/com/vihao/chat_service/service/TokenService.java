package com.vihao.chat_service.service;

import com.auth0.jwt.JWT;
import com.auth0.jwt.exceptions.JWTDecodeException;
import com.auth0.jwt.interfaces.DecodedJWT;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class TokenService {
    HttpServletRequest request;

    public String getTokenFromHeader() {
        // Retrieve the token from the Authorization header
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken;
        }
        return null;
    }

    public String getSubFromToken() {
        String token = getTokenFromHeader();
        if (token == null) {
            throw new IllegalArgumentException("Token is missing");
        }

        try {
            // Decode the token and retrieve the 'sub' claim
            DecodedJWT decodedJWT = JWT.decode(token.substring(7));
            return decodedJWT.getClaim("sub").asString();
        } catch (JWTDecodeException e) {
            throw new IllegalArgumentException("Invalid token", e);
        }
    }
}
