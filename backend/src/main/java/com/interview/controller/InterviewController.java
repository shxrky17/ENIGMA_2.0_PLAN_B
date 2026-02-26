package com.interview.controller;

import com.interview.dto.*;
import com.interview.service.InterviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/interview")
public class InterviewController {

    private final InterviewService interviewService;

    public InterviewController(InterviewService interviewService) {
        this.interviewService = interviewService;
    }

    @PostMapping("/start")
    public ResponseEntity<StartInterviewResponse> start(@RequestBody StartInterviewRequest req) {
        return ResponseEntity.ok(interviewService.startSession(req));
    }

    @PostMapping("/{sessionId}/submit-code")
    public ResponseEntity<CodeSubmitResponse> submitCode(
            @PathVariable String sessionId,
            @RequestBody SubmitCodeRequest req) {
        return ResponseEntity.ok(interviewService.judgeCode(sessionId, req));
    }

    @PostMapping("/{sessionId}/end")
    public ResponseEntity<EndInterviewResponse> end(@PathVariable String sessionId) {
        return ResponseEntity.ok(interviewService.endSession(sessionId));
    }
}
