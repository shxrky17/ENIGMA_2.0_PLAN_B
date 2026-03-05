package com.interview.compiler.model;

import java.util.List;

public class JudgeResult {
    private boolean passed;
    private int passedCount;
    private int totalCount;
    private List<TestCaseResult> results;
    private String message;

    public boolean isPassed() {
        return passed;
    }

    public void setPassed(boolean passed) {
        this.passed = passed;
    }

    public int getPassedCount() {
        return passedCount;
    }

    public void setPassedCount(int passedCount) {
        this.passedCount = passedCount;
    }

    public int getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(int totalCount) {
        this.totalCount = totalCount;
    }

    public List<TestCaseResult> getResults() {
        return results;
    }

    public void setResults(List<TestCaseResult> results) {
        this.results = results;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
