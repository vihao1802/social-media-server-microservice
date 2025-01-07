package com.vihao.chat_service.controller;

import com.vihao.chat_service.dto.request.ChatMemberRequest;
import com.vihao.chat_service.dto.request.ChatRequest;
import com.vihao.chat_service.dto.response.ChatMemberResponse;
import com.vihao.chat_service.dto.response.ChatResponse;
import com.vihao.chat_service.service.ChatMemberService;
import com.vihao.chat_service.service.ChatService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/chat-members")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatMemberController {
    ChatMemberService chatMemberService;

    @GetMapping
    Page<ChatMemberResponse> getAll(Pageable pageable) {
        return chatMemberService.getAll(pageable);
    }
}
