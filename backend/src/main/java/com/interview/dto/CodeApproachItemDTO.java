package com.interview.dto;

public class CodeApproachItemDTO {
    private String title;
    private String summary;
    private int rating;

    public CodeApproachItemDTO() {
    }

    public CodeApproachItemDTO(String title, String summary, int rating) {
        this.title = title;
        this.summary = summary;
        this.rating = rating;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }
}

