package com.interview.dto;

import java.util.List;

public class PersonalisationSummaryDTO {
    private List<String> skills;
    private List<QuestionAskedDTO> questionsAsked;

    public PersonalisationSummaryDTO() {
    }

    public PersonalisationSummaryDTO(List<String> skills, List<QuestionAskedDTO> questionsAsked) {
        this.skills = skills;
        this.questionsAsked = questionsAsked;
    }

    public List<String> getSkills() {
        return skills;
    }

    public List<QuestionAskedDTO> getQuestionsAsked() {
        return questionsAsked;
    }

    public void setSkills(List<String> v) {
        this.skills = v;
    }

    public void setQuestionsAsked(List<QuestionAskedDTO> v) {
        this.questionsAsked = v;
    }
}
