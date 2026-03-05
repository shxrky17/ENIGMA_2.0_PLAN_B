package com.interview.dto;

import java.util.List;

public class CodeSubmissionDTO {
    private String language;
    private Integer questionId;
    private String questionText;
    private String code;
    private boolean passed;
    private String timeComplexity;
    private String spaceComplexity;
    private String feedback;
    private List<TestResultDTO> testResults;
    private String timestamp;

    public CodeSubmissionDTO() {
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public Integer getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Integer questionId) {
        this.questionId = questionId;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public boolean isPassed() {
        return passed;
    }

    public void setPassed(boolean passed) {
        this.passed = passed;
    }

    public String getTimeComplexity() {
        return timeComplexity;
    }

    public void setTimeComplexity(String timeComplexity) {
        this.timeComplexity = timeComplexity;
    }

    public String getSpaceComplexity() {
        return spaceComplexity;
    }

    public void setSpaceComplexity(String spaceComplexity) {
        this.spaceComplexity = spaceComplexity;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public List<TestResultDTO> getTestResults() {
        return testResults;
    }

    public void setTestResults(List<TestResultDTO> testResults) {
        this.testResults = testResults;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}

