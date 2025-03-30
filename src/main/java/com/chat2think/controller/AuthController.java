package com.chat2think.controller;

import com.chat2think.entity.User;
import com.chat2think.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");

        if (username == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username and password are required"));
        }

        String token = userService.loginUser(username, password);
        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid username or password"));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("username", username);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody Map<String, String> request) {
        User user = new User();
        user.setUsername(request.get("username"));
        user.setPassword(request.get("password"));
        user.setEmail(request.get("email"));
        String invitationCode = request.get("inviteCode");

        if (invitationCode == null || invitationCode.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invitation code is required"));
        }

        User registeredUser = userService.registerUser(user, invitationCode);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "User registered successfully");
        response.put("username", registeredUser.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/language/{language}")
    public ResponseEntity<?> updateLanguage(@PathVariable String language) {
        // 从SecurityContext获取当前用户ID
        // 实际项目中需要从JWT token中获取用户信息
        Long userId = 1L; // 示例用户ID
        userService.updatePreferredLanguage(userId, language);
        return ResponseEntity.ok().build();
    }
}