package com.interview.dto;

public class QuestionAskedDTO {
    private String skill;
    private String question;
    private String difficulty;

    public QuestionAskedDTO() {
    }

    public QuestionAskedDTO(String skill, String question, String difficulty) {
        this.skill = skill;
        this.question = question;
        this.difficulty = difficulty;
    }

    public String getSkill() {
        return skill;
    }

    public String getQuestion() {
        return question;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setSkill(String v) {
        this.skill = v;
    }

    public void setQuestion(String v) {
        this.question = v;
    }

    public void setDifficulty(String v) {
        this.difficulty = v;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final QuestionAskedDTO dto = new QuestionAskedDTO();

        public Builder skill(String v) {
            dto.skill = v;
            return this;
        }

        public Builder question(String v) {
            dto.question = v;
            return this;
        }

        public Builder difficulty(String v) {
            dto.difficulty = v;
            return this;
        }

        public QuestionAskedDTO build() {
            return dto;
        }
    }
}
