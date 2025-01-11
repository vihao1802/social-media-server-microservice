package com.vihao.chat_service.entity;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MessageWebsocket {
    String chatId;
    String senderName;
    Instant sentAt;
    String msgContent;
    String msgMediaContent;
    String replyTo;
}
