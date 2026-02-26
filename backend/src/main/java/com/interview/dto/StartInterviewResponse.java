package com.interview.dto;

public class StartInterviewResponse {
    private String sessionId;
    private PersonalizedQuestionDTO firstQuestion;
    private int totalQuestions;

    public StartInterviewResponse() {
    }

    public StartInterviewResponse(String sessionId, PersonalizedQuestionDTO firstQuestion, int totalQuestions) {
        this.sessionId = sessionId;
        this.firstQuestion = firstQuestion;
        this.totalQuestions = totalQuestions;
    }

    public String getSessionId() {
        return sessionId;
    }

    public PersonalizedQuestionDTO getFirstQuestion() {
        return firstQuestion;
    }

    public int getTotalQuestions() {
        return totalQuestions;
    }

    public void setSessionId(String s) {
        this.sessionId = s;
    }

    public void setFirstQuestion(PersonalizedQuestionDTO q) {
        this.firstQuestion = q;
    }

    public void setTotalQuestions(int t) {
        this.totalQuestions = t;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final StartInterviewResponse dto = new StartInterviewResponse();

        public Builder sessionId(String v) {
            dto.sessionId = v;
            return this;
        }

        public Builder firstQuestion(PersonalizedQuestionDTO v) {
            dto.firstQuestion = v;
            return this;
        }

        public Builder totalQuestions(int v) {
            dto.totalQuestions = v;
            return this;
        }

        public StartInterviewResponse build() {
            return dto;
        }
    }
}
