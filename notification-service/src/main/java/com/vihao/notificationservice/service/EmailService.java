package com.vihao.notificationservice.service;

import com.vihao.notificationservice.dto.kafka.MemberMessage;
import com.vihao.notificationservice.entity.Notification;
import com.vihao.notificationservice.entity.NotificationType;
import com.vihao.notificationservice.repository.NotificationRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class EmailService {
    NotificationRepository notificationRepository;

    public void sendEmail(MemberMessage msg) {
        notificationRepository.save(
                Notification.builder()
                .type(NotificationType.JOINED_MEMBER)
                .notificationDate(LocalDateTime.now())
                .build()
        );

        // get user email here

        // send email here

    }


}
