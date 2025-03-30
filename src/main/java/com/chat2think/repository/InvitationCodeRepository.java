package com.chat2think.repository;

import com.chat2think.entity.InvitationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InvitationCodeRepository extends JpaRepository<InvitationCode, Long> {
    InvitationCode findByCode(String code);
    InvitationCode findByCodeAndUsedFalse(String code);
}