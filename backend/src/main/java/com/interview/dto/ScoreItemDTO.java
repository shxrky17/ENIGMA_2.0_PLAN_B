package com.interview.dto;

public class ScoreItemDTO {
    private String label;
    private int score;
    private int max;
    private String note;

    public ScoreItemDTO() {
    }

    public ScoreItemDTO(String label, int score, int max, String note) {
        this.label = label;
        this.score = score;
        this.max = max;
        this.note = note;
    }

    public String getLabel() {
        return label;
    }

    public int getScore() {
        return score;
    }

    public int getMax() {
        return max;
    }

    public String getNote() {
        return note;
    }

    public void setLabel(String v) {
        this.label = v;
    }

    public void setScore(int v) {
        this.score = v;
    }

    public void setMax(int v) {
        this.max = v;
    }

    public void setNote(String v) {
        this.note = v;
    }
}
