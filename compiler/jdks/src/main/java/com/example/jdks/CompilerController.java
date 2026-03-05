package com.example.jdks;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/compiler")
@CrossOrigin(origins = { "http://localhost:5173", "http://localhost:3000" })
public class CompilerController {

    @Autowired
    private CodeService codeService;

    @Autowired
    private JudgeService judgeService;

    @PostMapping("/optimize-and-run")
    public ResponseEntity<?> processCode(@RequestBody Map<String, String> request) {
        String userCode = request.get("code");
        String language = request.getOrDefault("language", "java");

        // 1. Optimize & Execute
        Map<String, String> result = codeService.handleFullFlow(userCode, language);

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
