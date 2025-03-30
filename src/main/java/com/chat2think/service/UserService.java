package com.chat2think.service;

import com.chat2think.entity.User;
import org.springframework.security.core.userdetails.UserDetailsService;

public interface UserService extends UserDetailsService {
    String loginUser(String username, String password);
    User registerUser(User user, String invitationCode);
    User findByUsername(String username);
    User findByEmail(String email);
    void updatePreferredLanguage(Long userId, String language);
}