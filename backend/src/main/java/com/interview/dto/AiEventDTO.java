package com.interview.dto;

import java.util.List;

public class AiEventDTO {
    private String type;
    private String text;
    private PersonalizedQuestionDTO question;
    private int questionIdx;
    private int totalQuestions;

    public AiEventDTO() {
    }

    public AiEventDTO(String type, String text, PersonalizedQuestionDTO question, int questionIdx, int totalQuestions) {
        this.type = type;
        this.text = text;
        this.question = question;
        this.questionIdx = questionIdx;
        this.totalQuestions = totalQuestions;
    }

    public String getType() {
        return type;
    }

    public String getText() {
        return text;
    }

    public PersonalizedQuestionDTO getQuestion() {
        return question;
    }

    public int getQuestionIdx() {
        return questionIdx;
    }

    public int getTotalQuestions() {
        return totalQuestions;
    }

    public void setType(String type) {
        this.type = type;
    }

    public void setText(String text) {
        this.text = text;
    }

    public void setQuestion(PersonalizedQuestionDTO question) {
        this.question = question;
    }

    public void setQuestionIdx(int questionIdx) {
        this.questionIdx = questionIdx;
    }

    public void setTotalQuestions(int totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    // Builder-style static factory
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final AiEventDTO dto = new AiEventDTO();

        public Builder type(String v) {
            dto.type = v;
            return this;
        }

        public Builder text(String v) {
            dto.text = v;
            return this;
        }

        public Builder question(PersonalizedQuestionDTO v) {
            dto.question = v;
            return this;
        }

        public Builder questionIdx(int v) {
            dto.questionIdx = v;
            return this;
        }

        public Builder totalQuestions(int v) {
            dto.totalQuestions = v;
            return this;
        }

        public AiEventDTO build() {
            return dto;
        }
    }
}
