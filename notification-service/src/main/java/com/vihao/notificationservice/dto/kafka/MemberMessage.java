package com.vihao.notificationservice.dto.kafka;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MemberMessage {
    String memberId;
    String chatId;
}