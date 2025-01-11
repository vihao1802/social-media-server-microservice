package com.vihao.chat_service.controller;

import com.vihao.chat_service.dto.request.MessageRequest;
import com.vihao.chat_service.dto.response.MessagePageResponse;
import com.vihao.chat_service.dto.response.MessageResponse;
import com.vihao.chat_service.service.MessageService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/messages")
public class MessageController {
    MessageService messageService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse createMessage(@ModelAttribute MessageRequest request) {
        return messageService.createMessage(request);
    }

    @GetMapping
    public ResponseEntity<MessagePageResponse> getMessages(
            @RequestParam String chatId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant cursor,
            @RequestParam(defaultValue = "10") int size
    ) {
        MessagePageResponse response = messageService.getMessagesByChatId(chatId, cursor, size);
        return ResponseEntity.ok(response);
    }
}
