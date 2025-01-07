package com.vihao.chat_service.dto.response;

import com.vihao.chat_service.entity.Message;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatResponse {
    String id;
    String groupName;
    String groupAvatar;
    Boolean isGroup;
    Instant createdAt;
    List<String> chatMemberIds;
    Message latestMessage;
}
