package com.vihao.chat_service.client;

import com.vihao.chat_service.dto.response.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(
        name = "user-service",
        url = "${application.config.user-url}"
)
public interface UserServiceClient {

    @GetMapping("/{user-id}")
    UserResponse getUserById(@PathVariable("user-id") String userId);
}
