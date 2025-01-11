package com.vihao.chat_service.service;

import com.vihao.chat_service.client.UserServiceClient;
import com.vihao.chat_service.dto.request.ChatMemberCreationRequest;
import com.vihao.chat_service.dto.response.ChatMemberResponse;
import com.vihao.chat_service.entity.Chat;
import com.vihao.chat_service.entity.ChatMember;
import com.vihao.chat_service.exception.ResourceNotFoundException;
import com.vihao.chat_service.mapper.ChatMemberMapper;
import com.vihao.chat_service.repository.ChatMemberRepository;
import com.vihao.chat_service.repository.ChatRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatMemberService {
    ChatMemberRepository chatMemberRepository;
    ChatMemberMapper chatMemberMapper;
    ChatRepository chatRepository;
    MongoTemplate mongoTemplate;
    UserServiceClient userServiceClient;
    TokenService tokenService;

    public void addChatMemberList(String chatId, ChatMemberCreationRequest request) {
        chatRepository.findById(chatId).orElseThrow(() -> new ResourceNotFoundException("ChatId not found in addChatMemberList"));

        request.getMembers().forEach(reqMembers -> {
            ChatMember m = ChatMember.builder()
                    .userId(reqMembers.getUserId())
                    .chatId(chatId)
                    .isAdmin(reqMembers.getIsAdmin())
                    .joinedAt(Instant.now())
                    .build();
            chatMemberRepository.save(m);
            addMemberIdToChat(chatId,m.getUserId());
        });
    }

    public void addMemberIdToChat(String chatId, String memberId) {
        Query query = new Query(Criteria.where("_id").is(chatId));
        Update update = new Update().push("chat_member_ids", memberId);
        mongoTemplate.updateFirst(query, update, Chat.class);
    }

    public Page<ChatMemberResponse> getAll(Pageable pageable) {
        return chatMemberRepository.findAll(pageable)
                .map(chatMemberMapper::toChatMemberResponse);
    }

    public List<ChatMemberResponse> getAllMembersByChatId(String chatId) {
        chatRepository.findById(chatId).orElseThrow(() -> new ResourceNotFoundException("ChatId not found in getAllMembersByChatId"));

        return chatMemberRepository
                .findByChatIdOrderByJoinedAtDesc(chatId)
                .stream()
                .map(member -> {
                    ChatMemberResponse res = chatMemberMapper.toChatMemberResponse(member);
                    res.setUser(userServiceClient.getUserById(member.getUserId(),tokenService.getTokenFromHeader()));
                    return res;
                })
                .toList();
    }
}
