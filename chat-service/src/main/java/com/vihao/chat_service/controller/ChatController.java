package com.vihao.chat_service.controller;

import com.vihao.chat_service.dto.request.ChatMemberCreationRequest;
import com.vihao.chat_service.dto.request.ChatRequest;
import com.vihao.chat_service.dto.request.MessageRequest;
import com.vihao.chat_service.dto.response.ChatAndMemberResponse;
import com.vihao.chat_service.dto.response.ChatMemberResponse;
import com.vihao.chat_service.dto.response.ChatResponse;
import com.vihao.chat_service.dto.response.MessageResponse;
import com.vihao.chat_service.entity.MessageWebsocket;
import com.vihao.chat_service.service.ChatMemberService;
import com.vihao.chat_service.service.ChatService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/chats")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatController {
    ChatService chatService;
    ChatMemberService chatMemberService;
    SimpMessagingTemplate simpMessagingTemplate;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ChatResponse createChat(@ModelAttribute ChatRequest request) {
        return chatService.createChat(request);
    }

    @GetMapping
    Page<ChatResponse> getAll(Pageable pageable) {
        return chatService.getAll(pageable);
    }

    @GetMapping("/users/{user-id}")
    Page<ChatResponse> getAllByUserId(@PathVariable("user-id") String userId, Pageable pageable) {
        return chatService.getAllByUserId(userId, pageable);
    }

    @GetMapping("/{chat-id}")
    ChatAndMemberResponse getById(@PathVariable("chat-id") String chatId) {
        return chatService.getById(chatId);
    }

    @GetMapping("/{chat-id}/members")
    public List<ChatMemberResponse> getAllMembersByChatId(@PathVariable("chat-id") String chatId) {
        return chatMemberService.getAllMembersByChatId(chatId);
    }

    @PostMapping("/{chat-id}/members")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<String> addChatMemberList(@PathVariable("chat-id") String chatId, @RequestBody ChatMemberCreationRequest request) {
        try {
            chatMemberService.addChatMemberList(chatId,request);
            return ResponseEntity.ok("Members were added to chatId: " + chatId);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred when add members to chatId: " + chatId);
        }
    }

    @MessageMapping("/send-message")
    public void sendWebsocketMessage(
        @Payload MessageRequest messageWebsocket
    ) {
        String chatId = messageWebsocket.getChatId();
        // Handle the incoming message
        simpMessagingTemplate.convertAndSend("/topic/chat/" + chatId,messageWebsocket);
        System.out.println("Received message: " + messageWebsocket);
    }

}
