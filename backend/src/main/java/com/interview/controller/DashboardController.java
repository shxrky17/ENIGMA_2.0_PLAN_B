package com.interview.controller;

import com.interview.dto.SessionSummaryDTO;
import com.interview.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final ReportService reportService;

    public DashboardController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/history")
    public ResponseEntity<List<SessionSummaryDTO>> getHistory() {
        return ResponseEntity.ok(reportService.getAllSessions());
    }
}
