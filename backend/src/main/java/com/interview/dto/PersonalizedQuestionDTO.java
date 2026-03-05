package com.interview.dto;

import java.util.List;

public class PersonalizedQuestionDTO {
    private int id;
    private String text;
    private String topic;
    private String skill;
    private String difficulty;
    private List<String> followUps;

    public PersonalizedQuestionDTO() {
    }

    public PersonalizedQuestionDTO(int id, String text, String topic, String skill, String difficulty,
            List<String> followUps) {
        this.id = id;
        this.text = text;
        this.topic = topic;
        this.skill = skill;
        this.difficulty = difficulty;
        this.followUps = followUps;
    }

    public int getId() {
        return id;
    }

    public String getText() {
        return text;
    }

    public String getTopic() {
        return topic;
    }

    public String getSkill() {
        return skill;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public List<String> getFollowUps() {
        return followUps;
    }

    public void setId(int id) {
        this.id = id;
    }

    public void setText(String text) {
        this.text = text;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public void setSkill(String skill) {
        this.skill = skill;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }

    public void setFollowUps(List<String> followUps) {
        this.followUps = followUps;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final PersonalizedQuestionDTO dto = new PersonalizedQuestionDTO();

        public Builder id(int v) {
            dto.id = v;
            return this;
        }

        public Builder text(String v) {
            dto.text = v;
            return this;
        }

        public Builder topic(String v) {
            dto.topic = v;
            return this;
        }

        public Builder skill(String v) {
            dto.skill = v;
            return this;
        }

        public Builder difficulty(String v) {
            dto.difficulty = v;
            return this;
        }

        public Builder followUps(List<String> v) {
            dto.followUps = v;
            return this;
        }

        public PersonalizedQuestionDTO build() {
            return dto;
        }
    }
}
