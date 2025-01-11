package com.vihao.chat_service.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatAndMemberResponse {
    String id;
    String groupName;
    String groupAvatar;
    Boolean isGroup;
    Instant createdAt;
    List<ChatMemberResponse> chatMembers;
//    MessageResponse latestMessage;
}
