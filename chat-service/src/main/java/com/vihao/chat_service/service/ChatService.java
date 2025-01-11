package com.vihao.chat_service.service;

import com.vihao.chat_service.client.UserServiceClient;
import com.vihao.chat_service.dto.request.ChatRequest;
import com.vihao.chat_service.dto.response.ChatAndMemberResponse;
import com.vihao.chat_service.dto.response.ChatMemberResponse;
import com.vihao.chat_service.dto.response.ChatResponse;
import com.vihao.chat_service.dto.response.UserResponse;
import com.vihao.chat_service.entity.Chat;
import com.vihao.chat_service.exception.FieldNotNullException;
import com.vihao.chat_service.exception.ResourceNotFoundException;
import com.vihao.chat_service.mapper.ChatMapper;
import com.vihao.chat_service.repository.ChatRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import org.apache.catalina.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatService {
    ChatMapper chatMapper;
    ChatRepository chatRepository;
    UploadFileService uploadFileService;
    UserServiceClient userServiceClient;
    TokenService tokenService;
    ChatMemberService chatMemberService;
    MessageService messageService;

    public ChatResponse createChat(ChatRequest request) {
        if(request.getGroupAvatar().isEmpty()) {
            throw new FieldNotNullException("Create chat can not have an empty group avatar");
        }

        var chatId = UUID.randomUUID().toString();

        var fileUrl = uploadFileService
                .uploadFile(request.getGroupAvatar(), "group-avatar-"+chatId+".png");

        Chat chat = Chat.builder()
                .id(chatId)
                .groupAvatar(request.getIsGroup() ? fileUrl : "")
                .groupName(request.getIsGroup() ? request.getGroupName() : "")
                .createdAt(Instant.now())
                .isGroup(request.getIsGroup())
                .chatMemberIds(null)
                .latestMessage(null)
                .build();

        chat = chatRepository.save(chat);

        return chatMapper.toChatResponse(chat);
    }

    public Page<ChatResponse> getAll(Pageable pageable) {
        return chatRepository.findAll(pageable).map(chatMapper::toChatResponse);
    }

    public ChatAndMemberResponse getById(String chatId) {
        Chat chat =  chatRepository.findById(chatId).orElseThrow(() -> new ResourceNotFoundException("ChatId not found"));
        ChatAndMemberResponse res = chatMapper.toChatAndMemberResponse(chat);
        List<ChatMemberResponse> list = chatMemberService.getAllMembersByChatId(chatId);
        res.setChatMembers(list);
        return res;
    }

    public Page<ChatResponse> getAllByUserId(String userId, Pageable pageable) {
        Pageable sortedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC,"latestMessage.sentAt")
        );

        Page<Chat> chats = chatRepository.findAllByChatMemberIdsContains(userId,sortedPageable);
        HashMap<String,UserResponse> cachedUser = new HashMap<>();

        return chats.map(chat -> {
            ChatResponse chatResponse = chatMapper.toChatResponse(chat);

            if(!chat.getIsGroup() && chat.getChatMemberIds().size() == 2) {
                // this is for 2 people chat logic
                chat.getChatMemberIds().forEach(memberId -> {
                    if(!memberId.equals(userId)) { // check if not the user signed in
                        UserResponse user = userServiceClient.getUserById(memberId,tokenService.getTokenFromHeader());
                        chatResponse.setGroupAvatar(user.getProfileImg());
                        chatResponse.setGroupName(user.getUsername());
                    }
                });
            }
            chatResponse.setLatestMessage(messageService.getLatestMessageByChatId(chat.getId()));
            return chatResponse;
        });
    }

}
