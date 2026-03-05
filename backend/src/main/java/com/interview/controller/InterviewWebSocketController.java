package com.interview.controller;

import com.interview.dto.AiEventDTO;
import com.interview.dto.AnswerPayload;
import com.interview.service.InterviewService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.logging.Logger;

@Controller
public class InterviewWebSocketController {

    private static final Logger log = Logger.getLogger(InterviewWebSocketController.class.getName());

    private final SimpMessagingTemplate messaging;
    private final InterviewService interviewService;

    public InterviewWebSocketController(SimpMessagingTemplate messaging, InterviewService interviewService) {
        this.messaging = messaging;
        this.interviewService = interviewService;
    }

    /**
     * Frontend sends to: /app/interview/{sessionId}/answer
     * Backend broadcasts to: /topic/interview/{sessionId}
     */
    @MessageMapping("/interview/{sessionId}/answer")
    public void handleAnswer(
            @DestinationVariable String sessionId,
            @Payload AnswerPayload payload) {

        log.fine("Received answer for session " + sessionId);
        try {
            AiEventDTO event = interviewService.handleAnswer(sessionId, payload);
            messaging.convertAndSend("/topic/interview/" + sessionId, event);
        } catch (Exception e) {
            log.severe("WebSocket handler error: " + e.getMessage());
            AiEventDTO errorEvent = new AiEventDTO(
                    "AI_FOLLOWUP",
                    "Can you elaborate on that answer a bit more?",
                    null,
                    payload.getQuestionIdx(),
                    0);
            messaging.convertAndSend("/topic/interview/" + sessionId, errorEvent);
        }
    }
}
