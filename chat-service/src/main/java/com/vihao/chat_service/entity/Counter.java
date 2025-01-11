package com.vihao.chat_service.entity;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "counters")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Counter {
    @MongoId
    String id;

    long sequenceValue;
}
