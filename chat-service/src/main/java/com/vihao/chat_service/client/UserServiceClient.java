package com.vihao.chat_service.client;

import com.vihao.chat_service.dto.response.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(
        name = "user-service",
        url = "${application.config.user.service.url}"
)
public interface UserServiceClient {

    @GetMapping("/{user-id}")
    UserResponse getUserById(
            @PathVariable("user-id") String userId,
            @RequestHeader("Authorization") String token
    );
}
