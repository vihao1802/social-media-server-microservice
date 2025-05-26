package com.vihao.notificationservice.dto.kafka;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RelationshipMessage {

        private String senderId;
        private String receiverId;
        private String relation;

}
