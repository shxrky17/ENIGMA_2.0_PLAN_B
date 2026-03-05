package com.interview.repository;

import com.interview.model.InterviewSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, String> {
    List<InterviewSession> findAllByOrderByStartedAtDesc();
    List<InterviewSession> findByStatus(String status);
}
