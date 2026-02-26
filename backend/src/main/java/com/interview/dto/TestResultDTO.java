package com.interview.dto;

public class TestResultDTO {
    private String input;
    private String expected;
    private String actual;
    private String status;

    public TestResultDTO() {
    }

    public TestResultDTO(String input, String expected, String actual, String status) {
        this.input = input;
        this.expected = expected;
        this.actual = actual;
        this.status = status;
    }

    public String getInput() {
        return input;
    }

    public String getExpected() {
        return expected;
    }

    public String getActual() {
        return actual;
    }

    public String getStatus() {
        return status;
    }

    public void setInput(String v) {
        this.input = v;
    }

    public void setExpected(String v) {
        this.expected = v;
    }

    public void setActual(String v) {
        this.actual = v;
    }

    public void setStatus(String v) {
        this.status = v;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final TestResultDTO dto = new TestResultDTO();

        public Builder input(String v) {
            dto.input = v;
            return this;
        }

        public Builder expected(String v) {
            dto.expected = v;
            return this;
        }

        public Builder actual(String v) {
            dto.actual = v;
            return this;
        }

        public Builder status(String v) {
            dto.status = v;
            return this;
        }

        public TestResultDTO build() {
            return dto;
        }
    }
}
