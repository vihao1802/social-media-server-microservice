package com.vihao.chat_service.service;

import com.vihao.chat_service.client.UserServiceClient;
import com.vihao.chat_service.dto.request.MessageRequest;
import com.vihao.chat_service.dto.response.MessagePageResponse;
import com.vihao.chat_service.dto.response.MessageResponse;
import com.vihao.chat_service.dto.response.UserResponse;
import com.vihao.chat_service.entity.Chat;
import com.vihao.chat_service.entity.Message;
import com.vihao.chat_service.exception.ResourceNotFoundException;
import com.vihao.chat_service.mapper.MessageMapper;
import com.vihao.chat_service.repository.ChatRepository;
import com.vihao.chat_service.repository.MessageRepository;
import com.vihao.chat_service.service.interfaces.SequenceGenerator;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MessageService {
    MessageRepository messageRepository;
    MessageMapper messageMapper;
    ChatRepository chatRepository;
    UploadFileService uploadFileService;
    SequenceGenerator sequenceGenerator;
    MongoTemplate mongoTemplate;
    UserServiceClient userServiceClient;
    TokenService tokenService;

    public MessageResponse createMessage(MessageRequest request) {
        chatRepository.findById(request.getChatId())
                .orElseThrow(() -> new ResourceNotFoundException("ChatId not found at createMessage"));

        String fileUrl;
        long messageId = sequenceGenerator
                .generateSequenceValue("message_id"); // message_id is the _id field value in document of Counter collection

        System.out.println("messageId: " + messageId);

        if(request.getMsgMediaContent() != null && !request.getMsgMediaContent().isEmpty()) {
            // if user send message via image
            fileUrl = uploadFileService
                    .uploadFile(request.getMsgMediaContent(),"message-media-"+messageId+".png");
        } else {
            fileUrl = "";
        }

        Message msg = Message.builder()
                .id(messageId)
                .chatId(request.getChatId())
                .msgContent(request.getMsgContent())
                .msgMediaContent(fileUrl)
                .senderId(request.getSenderId())
                .senderName(request.getSenderName())
                .sentAt(Instant.now())
                .replyTo(request.getReplyTo())
                .build();

        messageRepository.save(msg);
        addLatestMessageToChat(msg.getChatId(),msg);
        return messageMapper.entityToResponse(msg);
    }

    public void addLatestMessageToChat(String chatId, Message msg) {
        Query query = new Query(Criteria.where("_id").is(chatId));
        Update update = new Update().set("latest_message",msg); // $set replace the value
        mongoTemplate.updateFirst(query, update, Chat.class);
    }

    /*public Page<MessageResponse> getMessagesByChatId(String chatId, Pageable pageable) {
        return messageRepository.findAllByChatIdOrderBySentAtDesc(chatId,pageable)
                .map(messageMapper::entityToResponse);
    }*/

    public MessagePageResponse getMessagesByChatId(String chatId, Instant cursor, int size) {
        Pageable pageable = PageRequest
                .of(0, size, Sort.by(Sort.Direction.DESC, "sentAt"));
        List<Message> messages;

        if (cursor == null) {
            // Fetch the latest messages
            messages = messageRepository
                    .findByChatId(chatId, pageable);
        } else {
            // Fetch older messages based on the cursor
            messages = messageRepository
                    .findMessagesByChatIdAndCursor(chatId, cursor, pageable);
        }

        HashMap<String,UserResponse> cachedUser = new HashMap<>();
        String currUserId = tokenService.getSubFromToken();

        List<MessageResponse> messageResponses = messages
                .stream()
                .map(msg -> {
                    MessageResponse res = messageMapper.entityToResponse(msg);

                    if(!currUserId.equals(msg.getSenderId())) {
                        if(cachedUser.get(res.getSenderId()) == null) {
                            UserResponse user =  userServiceClient.getUserById(msg.getSenderId(),tokenService.getTokenFromHeader());
                            cachedUser.put(user.getId(),user);
                        }
                        res.setSenderName(cachedUser.get(res.getSenderId()).getUsername());
                        res.setSenderAvatar(cachedUser.get(res.getSenderId()).getProfileImg());
                    }

                    return res;
                })
                .sorted(Comparator.comparing(MessageResponse::getSentAt))
                .collect(Collectors.toList());

        // Determine the next cursor (oldest message's `sentAt`)
        Instant nextCursor = messages.isEmpty() ? null : messages.getLast().getSentAt();

        return new MessagePageResponse(messageResponses, nextCursor);
    }

    public MessageResponse getLatestMessageByChatId(String chatId) {
        Message message = messageRepository.findTopByChatIdOrderBySentAtDesc(chatId);
        return messageMapper.entityToResponse(message);
    }
}
