package com.vihao.chat_service.repository;

import com.vihao.chat_service.entity.Chat;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatRepository extends MongoRepository<Chat, String> {
    Page<Chat> findAllByChatMemberIdsContains(String userId, Pageable pageable);
}
