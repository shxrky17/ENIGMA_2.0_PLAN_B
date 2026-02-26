package com.interview.dto;

public class FollowUpQuestionDTO {
    private String question;
    private String difficulty;
    private String topic;

    public FollowUpQuestionDTO() {
    }

    public FollowUpQuestionDTO(String question, String difficulty, String topic) {
        this.question = question;
        this.difficulty = difficulty;
        this.topic = topic;
    }

    public String getQuestion() {
        return question;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public String getTopic() {
        return topic;
    }

    public void setQuestion(String v) {
        this.question = v;
    }

    public void setDifficulty(String v) {
        this.difficulty = v;
    }

    public void setTopic(String v) {
        this.topic = v;
    }
}
