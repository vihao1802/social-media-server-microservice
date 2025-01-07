package com.vihao.chat_service.dto.request;


import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatMemberRequest {
    @NotNull(message = "UserId cannot be null")
    String userId;

    Boolean isAdmin;
}
