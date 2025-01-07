package com.vihao.chat_service.entity;

import com.vihao.chat_service.enums.MessageType;
import jakarta.validation.constraints.Size;

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

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "messages")
public class Message {
    @MongoId
    long id;

    @Field(value = "chat_id")
    String chatId;

    @Field(value = "sender_id")
    String senderId;

    @Field(value = "reply_to")
    String replyTo; // message_id

    @Field(value = "msg_content")
//    @NotEmpty(message = "Message content is empty")
    @Size(max = 1000, message = "Message content's max length is 1000")
    String msgContent;

    @Field(value = "msg_media_content")
    String msgMediaContent;

    @Field(value = "sent_at")
    Instant sentAt;

//    @Field(value = "msg_type")
//    MessageType msgType;
}
