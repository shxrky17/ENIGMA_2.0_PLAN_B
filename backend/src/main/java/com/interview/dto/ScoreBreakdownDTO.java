package com.interview.dto;

import java.util.List;

public class ScoreBreakdownDTO {
    private int score;
    private List<ScoreItemDTO> breakdown;

    public ScoreBreakdownDTO() {
    }

    public ScoreBreakdownDTO(int score, List<ScoreItemDTO> breakdown) {
        this.score = score;
        this.breakdown = breakdown;
    }

    public int getScore() {
        return score;
    }

    public List<ScoreItemDTO> getBreakdown() {
        return breakdown;
    }

    public void setScore(int v) {
        this.score = v;
    }

    public void setBreakdown(List<ScoreItemDTO> v) {
        this.breakdown = v;
    }
}
