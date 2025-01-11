package com.vihao.chat_service.exception;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@AllArgsConstructor
public class ErrorDetails {
    private int status;
    private String message;
    private String details;
}
