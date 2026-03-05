package com.interview.dto;

import java.util.List;

public class SubmitCodeRequest {
    private String code;
    private String language;
    private Integer questionId;

    public SubmitCodeRequest() {
    }

    public String getCode() {
        return code;
    }

    public String getLanguage() {
        return language;
    }

    public Integer getQuestionId() {
        return questionId;
    }

    public void setCode(String v) {
        this.code = v;
    }

    public void setLanguage(String v) {
        this.language = v;
    }

    public void setQuestionId(Integer v) {
        this.questionId = v;
    }
}
