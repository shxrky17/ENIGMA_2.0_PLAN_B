package com.interview.dto;

public class LogicalStepDTO {
    private String phase;
    private int rating;
    private String detail;

    public LogicalStepDTO() {
    }

    public LogicalStepDTO(String phase, int rating, String detail) {
        this.phase = phase;
        this.rating = rating;
        this.detail = detail;
    }

    public String getPhase() {
        return phase;
    }

    public int getRating() {
        return rating;
    }

    public String getDetail() {
        return detail;
    }

    public void setPhase(String v) {
        this.phase = v;
    }

    public void setRating(int v) {
        this.rating = v;
    }

    public void setDetail(String v) {
        this.detail = v;
    }
}
