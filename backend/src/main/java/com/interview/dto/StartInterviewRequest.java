package com.interview.dto;

import java.util.List;

public class StartInterviewRequest {
    private List<String> skills;
    private String difficulty;
    private String topic;
    private String candidateName;
    private String candidateExperience;
    private String candidateEducation;

    public StartInterviewRequest() {
    }

    public List<String> getSkills() {
        return skills;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public String getTopic() {
        return topic;
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

    public void setSkills(List<String> v) {
        this.skills = v;
    }

    public void setDifficulty(String v) {
        this.difficulty = v;
    }

    public void setTopic(String v) {
        this.topic = v;
    }

    public void setCandidateName(String v) {
        this.candidateName = v;
    }

    public void setCandidateExperience(String v) {
        this.candidateExperience = v;
    }

    public void setCandidateEducation(String v) {
        this.candidateEducation = v;
    }
}
