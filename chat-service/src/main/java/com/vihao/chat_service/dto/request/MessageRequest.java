package com.vihao.chat_service.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.web.multipart.MultipartFile;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MessageRequest {
    @NotEmpty
    String chatId;

    @NotEmpty
    String senderId;

    @NotEmpty
    String senderName;

    String replyTo; // message_id

    @NotEmpty(message = "Message content is empty")
    @Size(max = 1000, message = "Message content's max length is 1000")
    String msgContent;

    MultipartFile msgMediaContent;
}
