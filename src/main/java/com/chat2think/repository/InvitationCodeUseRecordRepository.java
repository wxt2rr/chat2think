package com.chat2think.repository;

import com.chat2think.entity.InvitationCodeUseRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InvitationCodeUseRecordRepository extends JpaRepository<InvitationCodeUseRecord, Long> {
    InvitationCodeUseRecord findByCode(String code);

    InvitationCodeUseRecord findByCodeAndUsedFalse(String code);
}