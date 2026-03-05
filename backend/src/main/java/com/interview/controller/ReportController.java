package com.interview.controller;

import com.interview.dto.FollowUpQuestionDTO;
import com.interview.dto.ReportDTO;
import com.interview.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/report")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/{reportId}")
    public ResponseEntity<ReportDTO> getReport(@PathVariable String reportId) {
        return ResponseEntity.ok(reportService.getReport(reportId));
    }

    /**
     * Generate additional follow-up questions for a completed interview report.
     * Called when the user clicks "Generate More" on the Report page.
     */
    @PostMapping("/{reportId}/generate-more")
    public ResponseEntity<List<FollowUpQuestionDTO>> generateMore(
            @PathVariable String reportId) {
        List<FollowUpQuestionDTO> moreQuestions = reportService.generateMoreFollowUps(reportId);
        return ResponseEntity.ok(moreQuestions);
    }
}
