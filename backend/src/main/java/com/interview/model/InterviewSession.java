package com.interview.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "interview_sessions")
public class InterviewSession {

    @Id
    private String id;

    private String difficulty;
    private String topic;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "session_skills", joinColumns = @JoinColumn(name = "session_id"))
    @Column(name = "skill")
    private List<String> candidateSkills = new ArrayList<>();

    private String status;
    private int currentQuestionIdx = 0;

    private LocalDateTime startedAt;
    private LocalDateTime endedAt;

    private String candidateName;
    private String candidateExperience;
    private String candidateEducation;

    public InterviewSession() {
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null)
            this.id = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        if (this.status == null)
            this.status = "ACTIVE";
        if (this.startedAt == null)
            this.startedAt = LocalDateTime.now();
    }

    // Getters
    public String getId() {
        return id;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public String getTopic() {
        return topic;
    }

    public List<String> getCandidateSkills() {
        return candidateSkills;
    }

    public String getStatus() {
        return status;
    }

    public int getCurrentQuestionIdx() {
        return currentQuestionIdx;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public LocalDateTime getEndedAt() {
        return endedAt;
    }

    public String getCandidateName() {
        return candidateName;
    }

    public String getCandidateExperience() {
        return candidateExperience;
    }

    public String getCandidateEducation() {
        return candidateEducation;
    }

    // Setters
    public void setId(String id) {
        this.id = id;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public void setCandidateSkills(List<String> candidateSkills) {
        this.candidateSkills = candidateSkills;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setCurrentQuestionIdx(int currentQuestionIdx) {
        this.currentQuestionIdx = currentQuestionIdx;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public void setEndedAt(LocalDateTime endedAt) {
        this.endedAt = endedAt;
    }

    public void setCandidateName(String candidateName) {
        this.candidateName = candidateName;
    }

    public void setCandidateExperience(String candidateExperience) {
        this.candidateExperience = candidateExperience;
    }

    public void setCandidateEducation(String candidateEducation) {
        this.candidateEducation = candidateEducation;
    }
}
