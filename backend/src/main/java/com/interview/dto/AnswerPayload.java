package com.interview.dto;

public class AnswerPayload {
    private String questionText;
    private String transcript;
    private int questionId;
    private int questionIdx;

    public AnswerPayload() {
    }

    public AnswerPayload(String questionText, String transcript, int questionId, int questionIdx) {
        this.questionText = questionText;
        this.transcript = transcript;
        this.questionId = questionId;
        this.questionIdx = questionIdx;
    }

    public String getQuestionText() {
        return questionText;
    }

    public String getTranscript() {
        return transcript;
    }

    public int getQuestionId() {
        return questionId;
    }

    public int getQuestionIdx() {
        return questionIdx;
    }

    public void setQuestionText(String v) {
        this.questionText = v;
    }

    public void setTranscript(String v) {
        this.transcript = v;
    }

    public void setQuestionId(int v) {
        this.questionId = v;
    }

    public void setQuestionIdx(int v) {
        this.questionIdx = v;
    }
}
