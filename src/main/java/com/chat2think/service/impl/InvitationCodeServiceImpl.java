package com.chat2think.service.impl;

import com.chat2think.entity.InvitationCode;
import com.chat2think.repository.InvitationCodeRepository;
import com.chat2think.service.InvitationCodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InvitationCodeServiceImpl implements InvitationCodeService {

    private final InvitationCodeRepository invitationCodeRepository;

    @Override
    @Transactional
    public InvitationCode validateAndUseInvitationCode(String code) {
        InvitationCode invitationCode = invitationCodeRepository.findByCodeAndUsedFalse(code);
        if (invitationCode != null) {
            throw new RuntimeException("Invalid or already used invitation code");
        }
        return invitationCode;
    }

    @Override
    public InvitationCode generateInvitationCode() {
        InvitationCode invitationCode = new InvitationCode();
        invitationCode.setCode(UUID.randomUUID().toString().substring(0, 8));
        return invitationCodeRepository.save(invitationCode);
    }
}