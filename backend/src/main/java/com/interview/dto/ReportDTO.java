package com.interview.dto;

import java.util.List;

public class ReportDTO {
    private int overall;
    private String role;
    private String date;
    private String duration;
    private ScoreBreakdownDTO technical;
    private ScoreBreakdownDTO communication;
    private LogicalAnalysisDTO logicalAnalysis;
    private List<FollowUpQuestionDTO> followUpQuestions;
    private List<String> strengths;
    private List<String> improvements;
    private PersonalisationSummaryDTO personalisation;

    public ReportDTO() {
    }

    public ReportDTO(int overall, String role, String date, String duration,
            ScoreBreakdownDTO technical, ScoreBreakdownDTO communication,
            LogicalAnalysisDTO logicalAnalysis, List<FollowUpQuestionDTO> followUpQuestions,
            List<String> strengths, List<String> improvements,
            PersonalisationSummaryDTO personalisation) {
        this.overall = overall;
        this.role = role;
        this.date = date;
        this.duration = duration;
        this.technical = technical;
        this.communication = communication;
        this.logicalAnalysis = logicalAnalysis;
        this.followUpQuestions = followUpQuestions;
        this.strengths = strengths;
        this.improvements = improvements;
        this.personalisation = personalisation;
    }

    public int getOverall() {
        return overall;
    }

    public String getRole() {
        return role;
    }

    public String getDate() {
        return date;
    }

    public String getDuration() {
        return duration;
    }

    public ScoreBreakdownDTO getTechnical() {
        return technical;
    }

    public ScoreBreakdownDTO getCommunication() {
        return communication;
    }

    public LogicalAnalysisDTO getLogicalAnalysis() {
        return logicalAnalysis;
    }

    public List<FollowUpQuestionDTO> getFollowUpQuestions() {
        return followUpQuestions;
    }

    public List<String> getStrengths() {
        return strengths;
    }

    public List<String> getImprovements() {
        return improvements;
    }

    public PersonalisationSummaryDTO getPersonalisation() {
        return personalisation;
    }

    public void setOverall(int v) {
        this.overall = v;
    }

    public void setRole(String v) {
        this.role = v;
    }

    public void setDate(String v) {
        this.date = v;
    }

    public void setDuration(String v) {
        this.duration = v;
    }

    public void setTechnical(ScoreBreakdownDTO v) {
        this.technical = v;
    }

    public void setCommunication(ScoreBreakdownDTO v) {
        this.communication = v;
    }

    public void setLogicalAnalysis(LogicalAnalysisDTO v) {
        this.logicalAnalysis = v;
    }

    public void setFollowUpQuestions(List<FollowUpQuestionDTO> v) {
        this.followUpQuestions = v;
    }

    public void setStrengths(List<String> v) {
        this.strengths = v;
    }

    public void setImprovements(List<String> v) {
        this.improvements = v;
    }

    public void setPersonalisation(PersonalisationSummaryDTO v) {
        this.personalisation = v;
    }
}
