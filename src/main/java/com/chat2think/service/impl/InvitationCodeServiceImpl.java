package com.chat2think.service.impl;

import com.chat2think.entity.InvitationCode;
import com.chat2think.entity.InvitationCodeUseRecord;
import com.chat2think.repository.InvitationCodeRepository;
import com.chat2think.repository.InvitationCodeUseRecordRepository;
import com.chat2think.service.InvitationCodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InvitationCodeServiceImpl implements InvitationCodeService {

    private final InvitationCodeUseRecordRepository invitationCodeUseRecordRepository;

    private final InvitationCodeRepository invitationCodeRepository;

    @Override
    @Transactional
    public InvitationCode queryInvitationCode(String code) {
        return invitationCodeRepository.findByCode(code);
    }

    @Override
    public InvitationCode findUnUseInvitationCode() {
        return invitationCodeRepository.findUnUseInvitationCode();
    }

    @Override
    public void saveInvitationCodeUseRecord(InvitationCodeUseRecord invitationCodeUseRecord) {
        invitationCodeUseRecordRepository.save(invitationCodeUseRecord);
    }

    @Override
    public void saveInvitationCode(InvitationCode invitationCode) {
        invitationCodeRepository.save(invitationCode);
    }
}