package com.interview.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "interview_reports")
public class InterviewReport {

    @Id
    private String id;

    private String sessionId;

    // Scores
    private int overallScore;
    private int technicalScore;
    private int communicationScore;
    private int logicalReasoningScore;
    private int problemSpeedScore;

    // AI-generated content as JSON strings
    @Column(columnDefinition = "TEXT")
    private String technicalBreakdownJson;

    @Column(columnDefinition = "TEXT")
    private String communicationBreakdownJson;

    @Column(columnDefinition = "TEXT")
    private String logicalAnalysisJson;

    @Column(columnDefinition = "TEXT")
    private String followUpQuestionsJson;

    @Column(columnDefinition = "TEXT")
    private String strengthsJson;

    @Column(columnDefinition = "TEXT")
    private String improvementsJson;

    @Column(columnDefinition = "TEXT")
    private String aiSummary;

    @Column(columnDefinition = "TEXT")
    private String questionsAskedJson;

    public InterviewReport() {
    }

    @PrePersist
    public void prePersist() {
        if (this.id == null)
            this.id = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }

    // Getters
    public String getId() {
        return id;
    }

    public String getSessionId() {
        return sessionId;
    }

    public int getOverallScore() {
        return overallScore;
    }

    public int getTechnicalScore() {
        return technicalScore;
    }

    public int getCommunicationScore() {
        return communicationScore;
    }

    public int getLogicalReasoningScore() {
        return logicalReasoningScore;
    }

    public int getProblemSpeedScore() {
        return problemSpeedScore;
    }

    public String getTechnicalBreakdownJson() {
        return technicalBreakdownJson;
    }

    public String getCommunicationBreakdownJson() {
        return communicationBreakdownJson;
    }

    public String getLogicalAnalysisJson() {
        return logicalAnalysisJson;
    }

    public String getFollowUpQuestionsJson() {
        return followUpQuestionsJson;
    }

    public String getStrengthsJson() {
        return strengthsJson;
    }

    public String getImprovementsJson() {
        return improvementsJson;
    }

    public String getAiSummary() {
        return aiSummary;
    }

    public String getQuestionsAskedJson() {
        return questionsAskedJson;
    }

    // Setters
    public void setId(String id) {
        this.id = id;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public void setOverallScore(int overallScore) {
        this.overallScore = overallScore;
    }

    public void setTechnicalScore(int technicalScore) {
        this.technicalScore = technicalScore;
    }

    public void setCommunicationScore(int communicationScore) {
        this.communicationScore = communicationScore;
    }

    public void setLogicalReasoningScore(int logicalReasoningScore) {
        this.logicalReasoningScore = logicalReasoningScore;
    }

    public void setProblemSpeedScore(int problemSpeedScore) {
        this.problemSpeedScore = problemSpeedScore;
    }

    public void setTechnicalBreakdownJson(String technicalBreakdownJson) {
        this.technicalBreakdownJson = technicalBreakdownJson;
    }

    public void setCommunicationBreakdownJson(String communicationBreakdownJson) {
        this.communicationBreakdownJson = communicationBreakdownJson;
    }

    public void setLogicalAnalysisJson(String logicalAnalysisJson) {
        this.logicalAnalysisJson = logicalAnalysisJson;
    }

    public void setFollowUpQuestionsJson(String followUpQuestionsJson) {
        this.followUpQuestionsJson = followUpQuestionsJson;
    }

    public void setStrengthsJson(String strengthsJson) {
        this.strengthsJson = strengthsJson;
    }

    public void setImprovementsJson(String improvementsJson) {
        this.improvementsJson = improvementsJson;
    }

    public void setAiSummary(String aiSummary) {
        this.aiSummary = aiSummary;
    }

    public void setQuestionsAskedJson(String questionsAskedJson) {
        this.questionsAskedJson = questionsAskedJson;
    }
}
