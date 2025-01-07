package com.vihao.chat_service.dto.response;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MessageResponse {
    long id;

    String chatId;

    String senderId;

    String replyTo; // message_id

    String msgContent;

    String msgMediaContent;

    Instant sentAt;
}
