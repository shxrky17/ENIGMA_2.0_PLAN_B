package com.example.jdks;

public class TestCaseResult {
    private int index;
    private String input;
    private String expectedOutput;
    private String actualOutput;
    private boolean passed;
    private String error;

    public int getIndex() {
        return index;
    }

    public void setIndex(int index) {
        this.index = index;
    }

    public String getInput() {
        return input;
    }

    public void setInput(String input) {
        this.input = input;
    }

    public String getExpectedOutput() {
        return expectedOutput;
    }

    public void setExpectedOutput(String expectedOutput) {
        this.expectedOutput = expectedOutput;
    }

    public String getActualOutput() {
        return actualOutput;
    }

    public void setActualOutput(String actualOutput) {
        this.actualOutput = actualOutput;
    }

    public boolean isPassed() {
        return passed;
    }

    public void setPassed(boolean passed) {
        this.passed = passed;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
