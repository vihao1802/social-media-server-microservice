package com.vihao.chat_service.entity;

import lombok.Data;
import lombok.Builder;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.experimental.FieldDefaults;

import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "chat_members")
public class ChatMember {
    @MongoId
    @Builder.Default
    String id = UUID.randomUUID().toString();

    @Field(value = "chat_id")
    String chatId;

    @Field(value = "user_id")
    String userId;

    @Field(value = "joined_at")
    Instant joinedAt;

    @Field(value = "is_admin")
    Boolean isAdmin;
}
