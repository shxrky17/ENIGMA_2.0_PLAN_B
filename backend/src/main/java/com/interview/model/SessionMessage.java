package com.interview.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "session_messages")
public class SessionMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String sessionId;
    private String sender; // "ai" | "user" | "system"

    @Column(columnDefinition = "TEXT")
    private String text;

    private LocalDateTime timestamp;

    public SessionMessage() {
    }

    public SessionMessage(String sessionId, String sender, String text) {
        this.sessionId = sessionId;
        this.sender = sender;
        this.text = text;
        this.timestamp = LocalDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.timestamp == null)
            this.timestamp = LocalDateTime.now();
    }

    // Getters
    public Long getId() {
        return id;
    }

    public String getSessionId() {
        return sessionId;
    }

    public String getSender() {
        return sender;
    }

    public String getText() {
        return text;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    // Setters
    public void setId(Long id) {
        this.id = id;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public void setText(String text) {
        this.text = text;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
