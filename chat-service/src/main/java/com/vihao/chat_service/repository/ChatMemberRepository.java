package com.vihao.chat_service.repository;

import com.vihao.chat_service.entity.ChatMember;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMemberRepository extends MongoRepository<ChatMember, String> {
    List<ChatMember> findByChatIdOrderByJoinedAtDesc(String chatId);
    Page<ChatMember> findChatMembersByUserId(String userId, Pageable pageable);
}
