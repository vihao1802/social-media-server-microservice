package com.vihao.chat_service.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

@Component
public class WebSocketSessionTracker {
    private final Set<String> onlineUsers = ConcurrentHashMap.newKeySet();

    public void addUser(String userId) {
        onlineUsers.add(userId);
    }

    public void removeUser(String userId) {
        onlineUsers.remove(userId);
    }

    public List<String> getOnlineUsers() {
        return new ArrayList<>(onlineUsers);
    }
}
