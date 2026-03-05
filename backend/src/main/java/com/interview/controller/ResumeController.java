package com.interview.controller;

import com.interview.dto.ResumeProfileDTO;
import com.interview.service.ResumeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/resume")
public class ResumeController {

    private final ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    @PostMapping("/upload")
    public ResponseEntity<ResumeProfileDTO> upload(@RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(resumeService.parseAndExtract(file));
    }
}
