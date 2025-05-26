package com.vihao.notificationservice.controller;

import com.fasterxml.jackson.databind.util.JSONPObject;
import com.vihao.notificationservice.dto.kafka.*;
import com.vihao.notificationservice.service.EmailService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.common.header.Header;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class EmailController {
    EmailService emailService;

    @KafkaListener(topics = "add-member")
    public void consumingMemberAdditionEvent(MemberMessage message) {
        log.info("Message received: {}", message);
        emailService.sendEmail(message);
    }

    @KafkaListener(topics = "create-post")
    public void consumingPostCreationEvent(PostMessage message) {
        log.info("Message received: {}", message);
    }

    @KafkaListener(topics = "create-comment")
    public void consumingCommentCreationEvent(CommentMessage message) {
        log.info("Message received: {}", message);
    }

    @KafkaListener(topics = "get-otp")
    public void consumingGetOTPEvent(OTPMessage message) {
        log.info("Message received: {}", message);
        this.emailService.sendEmail(message);
    }
    @KafkaListener(topics = "verify-email")
    public void consumingVerifyEmailEvent(VerifyMessage message) {
        log.info("Message received: {}", message);
        this.emailService.sendEmail(message);
    }

    @KafkaListener(topics = "relationship-notification")
    public void consumingRelationshipNotiEvent(RelationshipMessage message) {
        log.info("Message received: {}", message);
        log.info("Relationship Notification: User {} {}ed user {} ", message.getSenderId(), message.getRelation(), message.getReceiverId());
    }
}