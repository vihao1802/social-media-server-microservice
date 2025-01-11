package com.vihao.chat_service.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    String id;
    String email;
    String bio;
    String username;
    String profileImg;
    String gender;
    String DateOfBirth;
    Boolean isLocked;
    Boolean isDisabled;
    Boolean isOnline;
    String createdAt;
    int roleId;
    RoleResponse role;
}
