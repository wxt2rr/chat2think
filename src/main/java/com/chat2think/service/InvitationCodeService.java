package com.chat2think.service;

import com.chat2think.entity.InvitationCode;

public interface InvitationCodeService {
    InvitationCode validateAndUseInvitationCode(String code);
    InvitationCode generateInvitationCode();
}