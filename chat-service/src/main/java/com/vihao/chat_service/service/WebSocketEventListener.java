package com.vihao.chat_service.service;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class WebSocketEventListener {
    SimpMessagingTemplate simpMessagingTemplate;
    WebSocketSessionTracker sessionTracker;

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor sha = StompHeaderAccessor.wrap(event.getMessage());

        // If you sent the userId via a header, extract it here
        String userId = (String) sha.getSessionAttributes().get("userId");
        if (userId != null) {
            System.out.println("User disconnected: " + userId);
            sessionTracker.removeUser(userId);

            simpMessagingTemplate.convertAndSend("/topic/online-users", sessionTracker.getOnlineUsers());
        }
    }
}
