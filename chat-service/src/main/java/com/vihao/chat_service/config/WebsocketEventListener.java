package com.vihao.chat_service.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebsocketEventListener {

    @EventListener
    public void handleWebsocketDisconnectListener(
            SessionDisconnectEvent event
    ) {
        //TODO - to be implemented
    }
}
