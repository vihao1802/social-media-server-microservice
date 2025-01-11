package com.vihao.chat_service.mapper;

import com.vihao.chat_service.dto.response.ChatAndMemberResponse;
import com.vihao.chat_service.dto.response.ChatResponse;
import com.vihao.chat_service.entity.Chat;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ChatMapper {
    @Mapping(target = "chatMemberIds", source = "chatMemberIds")
    ChatResponse toChatResponse(Chat request);

    ChatAndMemberResponse toChatAndMemberResponse(Chat request);
}
