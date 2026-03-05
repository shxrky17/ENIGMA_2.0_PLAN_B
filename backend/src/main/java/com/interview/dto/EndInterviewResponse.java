package com.interview.dto;

public class EndInterviewResponse {
    private String reportId;

    public EndInterviewResponse() {
    }

    public EndInterviewResponse(String reportId) {
        this.reportId = reportId;
    }

    public String getReportId() {
        return reportId;
    }

    public void setReportId(String id) {
        this.reportId = id;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final EndInterviewResponse dto = new EndInterviewResponse();

        public Builder reportId(String v) {
            dto.reportId = v;
            return this;
        }

        public EndInterviewResponse build() {
            return dto;
        }
    }
}
