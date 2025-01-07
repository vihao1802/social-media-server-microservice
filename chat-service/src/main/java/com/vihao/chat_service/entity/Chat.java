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
import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "chats")
public class Chat { // chat 2 people and chat greater than 2 people in the same entity
    @MongoId
    String id = UUID.randomUUID().toString();

    @Field(name = "group_name")
    String groupName;

    @Field(name = "group_avatar")
    String groupAvatar;

    @Field(name = "is_group")
    Boolean isGroup;

    @Field(name = "created_at")
    Instant createdAt;

    @Field(name = "chat_member_ids")
    List<String> chatMemberIds;

    @Field(name = "latest_message")
    Message latestMessage;
}
