package com.interview.dto;

import java.util.List;

public class SessionSummaryDTO {
    private String sessionId;
    private String reportId;
    private String topic;
    private String difficulty;
    private int overallScore;
    private int technicalScore;
    private int communicationScore;
    private String status;
    private String date;
    private String duration;
    private List<String> skills;

    public SessionSummaryDTO() {
    }

    public SessionSummaryDTO(String sessionId, String reportId, String topic, String difficulty,
            int overallScore, int technicalScore, int communicationScore,
            String status, String date, String duration, List<String> skills) {
        this.sessionId = sessionId;
        this.reportId = reportId;
        this.topic = topic;
        this.difficulty = difficulty;
        this.overallScore = overallScore;
        this.technicalScore = technicalScore;
        this.communicationScore = communicationScore;
        this.status = status;
        this.date = date;
        this.duration = duration;
        this.skills = skills;
    }

    public String getSessionId() {
        return sessionId;
    }

    public String getReportId() {
        return reportId;
    }

    public String getTopic() {
        return topic;
    }

    public String getDifficulty() {
        return difficulty;
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

    public String getStatus() {
        return status;
    }

    public String getDate() {
        return date;
    }

    public String getDuration() {
        return duration;
    }

    public List<String> getSkills() {
        return skills;
    }

    public void setSessionId(String v) {
        this.sessionId = v;
    }

    public void setReportId(String v) {
        this.reportId = v;
    }

    public void setTopic(String v) {
        this.topic = v;
    }

    public void setDifficulty(String v) {
        this.difficulty = v;
    }

    public void setOverallScore(int v) {
        this.overallScore = v;
    }

    public void setTechnicalScore(int v) {
        this.technicalScore = v;
    }

    public void setCommunicationScore(int v) {
        this.communicationScore = v;
    }

    public void setStatus(String v) {
        this.status = v;
    }

    public void setDate(String v) {
        this.date = v;
    }

    public void setDuration(String v) {
        this.duration = v;
    }

    public void setSkills(List<String> v) {
        this.skills = v;
    }
}
