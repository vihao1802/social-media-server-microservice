package com.vihao.chat_service.mapper;

import com.vihao.chat_service.dto.response.ChatMemberResponse;
import com.vihao.chat_service.entity.ChatMember;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ChatMemberMapper {
    ChatMemberResponse toChatMemberResponse(ChatMember request);
}
