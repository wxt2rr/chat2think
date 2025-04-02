package com.chat2think.service;

import com.chat2think.entity.InvitationCode;
import com.chat2think.entity.InvitationCodeUseRecord;

public interface InvitationCodeService {
    InvitationCode queryInvitationCode(String code);

    InvitationCode findUnUseInvitationCode();

    void saveInvitationCodeUseRecord(InvitationCodeUseRecord invitationCodeUseRecord);

    void saveInvitationCode(InvitationCode invitationCode);
}