package com.interview.repository;

import com.interview.model.SessionMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SessionMessageRepository extends JpaRepository<SessionMessage, Long> {
    List<SessionMessage> findBySessionIdOrderByTimestampAsc(String sessionId);
}
