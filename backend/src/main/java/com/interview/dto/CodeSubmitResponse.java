package com.interview.dto;

import java.util.List;

public class CodeSubmitResponse {
    private boolean passed;
    private String timeComplexity;
    private String spaceComplexity;
    private String feedback;
    private List<TestResultDTO> testResults;

    public CodeSubmitResponse() {
    }

    public boolean isPassed() {
        return passed;
    }

    public String getTimeComplexity() {
        return timeComplexity;
    }

    public String getSpaceComplexity() {
        return spaceComplexity;
    }

    public String getFeedback() {
        return feedback;
    }

    public List<TestResultDTO> getTestResults() {
        return testResults;
    }

    public void setPassed(boolean v) {
        this.passed = v;
    }

    public void setTimeComplexity(String v) {
        this.timeComplexity = v;
    }

    public void setSpaceComplexity(String v) {
        this.spaceComplexity = v;
    }

    public void setFeedback(String v) {
        this.feedback = v;
    }

    public void setTestResults(List<TestResultDTO> v) {
        this.testResults = v;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final CodeSubmitResponse dto = new CodeSubmitResponse();

        public Builder passed(boolean v) {
            dto.passed = v;
            return this;
        }

        public Builder timeComplexity(String v) {
            dto.timeComplexity = v;
            return this;
        }

        public Builder spaceComplexity(String v) {
            dto.spaceComplexity = v;
            return this;
        }

        public Builder feedback(String v) {
            dto.feedback = v;
            return this;
        }

        public Builder testResults(List<TestResultDTO> v) {
            dto.testResults = v;
            return this;
        }

        public CodeSubmitResponse build() {
            return dto;
        }
    }
}
