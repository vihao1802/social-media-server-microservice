package com.vihao.chat_service.mapper;

import com.vihao.chat_service.dto.response.MessageResponse;
import com.vihao.chat_service.entity.Message;
import org.mapstruct.Mapper;

@Mapper
public interface MessageMapper {
    MessageResponse entityToResponse(Message msg);
}
