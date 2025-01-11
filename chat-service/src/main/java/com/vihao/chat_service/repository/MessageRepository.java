package com.vihao.chat_service.repository;

import com.vihao.chat_service.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface MessageRepository extends MongoRepository<Message,Long> {
    Page<Message> findAllByChatIdOrderBySentAtDesc(String chatId, Pageable pageable);


    // Fetch the latest messages
    @Query("{ 'chatId': ?0 }")
    List<Message> findByChatId(String chatId, Pageable pageable);

    // Fetch older messages based on cursor
    @Query("{ 'chatId': ?0, 'sentAt': { $lt: ?1 } }")
    //chatId: ?0: Filters messages by the chatId parameter.
    //sentAt: { $lt: ?1 }: Filters messages where the sentAt field is less than the provided cursor.
    List<Message> findMessagesByChatIdAndCursor(String chatId, Instant cursor, Pageable pageable);

    Message findTopByChatIdOrderBySentAtDesc(String chatId);
}
