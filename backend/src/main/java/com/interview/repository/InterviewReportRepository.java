package com.interview.repository;

import com.interview.model.InterviewReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InterviewReportRepository extends JpaRepository<InterviewReport, String> {
    Optional<InterviewReport> findBySessionId(String sessionId);
}
