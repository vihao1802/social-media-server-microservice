package com.vihao.chat_service.service;

import com.vihao.chat_service.dto.request.ChatRequest;
import com.vihao.chat_service.dto.response.ChatResponse;
import com.vihao.chat_service.entity.Chat;
import com.vihao.chat_service.exception.FieldNotNullException;
import com.vihao.chat_service.mapper.ChatMapper;
import com.vihao.chat_service.repository.ChatRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatService {
    ChatRepository chatRepository;
    ChatMapper chatMapper;
    UploadFileService uploadFileService;

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

    public Page<ChatResponse> getAllByUserId(String userId, Pageable pageable) {
        Pageable sortedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC,"latestMessage.sentAt")
        );

        Page<Chat> chats = chatRepository.findAllByChatMemberIdsContains(userId,sortedPageable);

        chats.forEach(chat -> {
            if(!chat.getIsGroup() && chat.getChatMemberIds().size() == 2) {
                // this is 2 people chat
                chat.getChatMemberIds().forEach(memberId -> {
                    if(!memberId.equals(userId)) {
//                        chat.setGroupAvatar();

                    }
                });
            }
        });

        return chats.map(chatMapper::toChatResponse);
    }

}
