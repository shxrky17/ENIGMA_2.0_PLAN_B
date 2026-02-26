package com.interview.dto;

import java.util.List;

public class LogicalAnalysisDTO {
    private String summary;
    private List<LogicalStepDTO> steps;

    public LogicalAnalysisDTO() {
    }

    public LogicalAnalysisDTO(String summary, List<LogicalStepDTO> steps) {
        this.summary = summary;
        this.steps = steps;
    }

    public String getSummary() {
        return summary;
    }

    public List<LogicalStepDTO> getSteps() {
        return steps;
    }

    public void setSummary(String v) {
        this.summary = v;
    }

    public void setSteps(List<LogicalStepDTO> v) {
        this.steps = v;
    }
}
