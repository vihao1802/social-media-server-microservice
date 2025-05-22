package com.vihao.notificationservice.controller;

import com.fasterxml.jackson.databind.util.JSONPObject;
import com.vihao.notificationservice.dto.kafka.MemberMessage;
import com.vihao.notificationservice.dto.kafka.PostMessage;
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
}