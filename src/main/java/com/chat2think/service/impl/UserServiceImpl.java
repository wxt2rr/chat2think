package com.chat2think.service.impl;

import com.chat2think.entity.User;
import com.chat2think.repository.UserRepository;
import com.chat2think.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.UUID;

import com.chat2think.entity.InvitationCode;
import com.chat2think.repository.InvitationCodeRepository;
import com.chat2think.service.InvitationCodeService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Override
    public String loginUser(String username, String password) {
        User user = userRepository.findByUsername(username);
        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            return null;
        }

        user.setLastLoginTime(LocalDateTime.now());
        userRepository.save(user);

        return Jwts.builder()
                .setSubject(user.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 864000000)) // 10 days
                .signWith(SignatureAlgorithm.HS512, jwtSecret)
                .compact();
    }

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final InvitationCodeService invitationCodeService;
    private final InvitationCodeRepository invitationCodeRepository;

    @Override
    @Transactional
    public User registerUser(User user, String invitationCode) {
        if (userRepository.findByUsername(user.getUsername()) != null) {
            throw new RuntimeException("用户名已存在");
        }
        if (user.getEmail() != null && userRepository.findByEmail(user.getEmail()) != null) {
            throw new RuntimeException("邮箱已被使用");
        }

        InvitationCode code = invitationCodeService.validateAndUseInvitationCode(invitationCode);
        if (code == null) {
            code = new InvitationCode();
        }
        code.setUsed(true);
        code.setUsedByUser(user);
        code.setUsedAt(LocalDateTime.now());
        code.setCode(invitationCode);

        user.setEmail(UUID.randomUUID().toString());
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setCode(invitationCode);
        User savedUser = userRepository.save(user);
        invitationCodeRepository.save(code);
        return savedUser;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new UsernameNotFoundException("User not found");
        }

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                new ArrayList<>()
        );
    }

    @Override
    public User findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    public User findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    @Transactional
    public void updatePreferredLanguage(Long userId, String language) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPreferredLanguage(language);
        userRepository.save(user);
    }
}