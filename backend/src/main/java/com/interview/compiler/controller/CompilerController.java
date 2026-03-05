package com.interview.compiler.controller;

import com.interview.compiler.model.CodeRequest;
import com.interview.compiler.service.CodeService;
import com.interview.compiler.service.JudgeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/compiler")
@CrossOrigin(origins = "http://localhost:5173") // Vite UI URL
public class CompilerController {

    @Autowired
    private CodeService codeService;

    @Autowired
    private JudgeService judgeService;

    @PostMapping("/optimize-and-run")
    public ResponseEntity<?> processCode(@RequestBody Map<String, String> request) {
        String userCode = request.get("code");

        // 1. Optimize & Execute
        Map<String, String> result = codeService.handleFullFlow(userCode);

        return ResponseEntity.ok(result);
    }

    @PostMapping("/judge")
    public ResponseEntity<?> judgeCode(@RequestBody CodeRequest request) {
        try {
            return ResponseEntity.ok(judgeService.evaluate(request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Evaluation failed: " + ex.getMessage()));
        }
    }
}
