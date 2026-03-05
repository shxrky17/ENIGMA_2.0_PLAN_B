package com.interview.dto;

public class InterviewContextEntryDTO {
    private String question;
    private String answer;
    private Integer questionId;
    private Integer questionIdx;
    private String timestamp;

    public InterviewContextEntryDTO() {
    }

    public InterviewContextEntryDTO(String question, String answer, Integer questionId, Integer questionIdx, String timestamp) {
        this.question = question;
        this.answer = answer;
        this.questionId = questionId;
        this.questionIdx = questionIdx;
        this.timestamp = timestamp;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public Integer getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Integer questionId) {
        this.questionId = questionId;
    }

    public Integer getQuestionIdx() {
        return questionIdx;
    }

    public void setQuestionIdx(Integer questionIdx) {
        this.questionIdx = questionIdx;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}

