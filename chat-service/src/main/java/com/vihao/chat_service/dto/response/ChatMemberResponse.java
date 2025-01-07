package com.vihao.chat_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatMemberResponse {
    String id;
    String chatId;
    String userId;
    Boolean isAdmin;
    Instant joinedAt;
}
