package com.vihao.notificationservice.service;

import com.vihao.notificationservice.dto.kafka.MemberMessage;
import com.vihao.notificationservice.dto.kafka.OTPMessage;
import com.vihao.notificationservice.dto.kafka.VerifyMessage;
import com.vihao.notificationservice.entity.Notification;
import com.vihao.notificationservice.entity.NotificationType;
import com.vihao.notificationservice.repository.NotificationRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class EmailService {
    NotificationRepository notificationRepository;

    @Autowired
    private JavaMailSender mailSender;
    public <T> void sendEmail(T msg) {
        String m ="";
        String to="";
        String subject = "";

        if(msg instanceof  MemberMessage memberMessage){
        notificationRepository.save(
                Notification.builder()
                .type(NotificationType.JOINED_MEMBER)
                .notificationDate(LocalDateTime.now())
                .build()
            );
        }else if(msg instanceof  OTPMessage otpMessage){
            m = otpMessage.getMessage();
            to = otpMessage.getEmail();
            subject = otpMessage.getSubject();
        }else if(msg instanceof  VerifyMessage verifyMessage){
            m = verifyMessage.getMessage();
            to = verifyMessage.getEmail();
            subject = verifyMessage.getSubject();
        }
        if(m.isEmpty() || to.isEmpty() || subject.isEmpty()) {
            throw new IllegalArgumentException("Email content, recipient, or subject cannot be empty");
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(m, true); // true = HTML
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email", e);
        }

    }


}
