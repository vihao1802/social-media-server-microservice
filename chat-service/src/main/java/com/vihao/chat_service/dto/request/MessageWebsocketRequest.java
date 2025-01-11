package com.vihao.chat_service.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MessageWebsocketRequest {
    String senderName;
    Instant sentAt;
    String msgContent;
    String msgMediaContent;
}
