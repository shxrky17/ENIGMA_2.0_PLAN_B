package com.interview.dto;

public class AuthResponse {
    private String userId;
    private String fullName;
    private String email;
    private String message;
    private boolean success;

    public AuthResponse(boolean success, String message, String userId, String fullName, String email) {
        this.success = success;
        this.message = message;
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
    }

    public AuthResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public String getUserId() {
        return userId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public String getMessage() {
        return message;
    }

    public boolean isSuccess() {
        return success;
    }
}
