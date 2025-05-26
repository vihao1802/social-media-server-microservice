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
    private String id;
    private String email;
    private String bio;
    private String username;
    private String profileImg;
    private String gender;
    private String dateOfBirth;        
    private Boolean isLocked;
    private Boolean isEmailVerified;     
    private Boolean isDisabled;
    private Boolean isOnline;
    private Boolean isPrivateAccount;    
    private String createdAt;
    private int roleId;
    private RoleResponse role;
}
