package com.interview.controller;

import com.interview.dto.ReportDTO;
import com.interview.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}
