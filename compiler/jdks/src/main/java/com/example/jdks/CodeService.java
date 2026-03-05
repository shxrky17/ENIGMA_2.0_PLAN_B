package com.example.jdks;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class CodeService {

    private final String PISTON_URL = "http://localhost:2000/api/v2/execute";

    public Map<String, String> handleFullFlow(String userCode, String language) {
        // 1. Get Optimized Code from AI
        String optimizedCode = callGeminiToOptimize(userCode);

        // 2. Prepare Piston Request
        Map<String, Object> pistonRequest = Map.of(
                "language", language,
                "version", "*",
                "files", List.of(Map.of("name", "main", "content", optimizedCode)));

        // 3. Run on Local Piston
        try {
            RestTemplate restTemplate = new RestTemplate();
            String output = restTemplate.postForObject(PISTON_URL, pistonRequest, String.class);
            return Map.of("optimized", optimizedCode, "output", output != null ? output : "No output from Piston");
        } catch (Exception e) {
            return Map.of("optimized", optimizedCode, "error", "Execution failed: " + e.getMessage());
        }
    }

    private String callGeminiToOptimize(String userCode) {
        // TODO: Replace with actual Gemini API integration.
        // For now, return the user code unchanged so execution flow remains functional.
        return userCode == null ? "" : userCode;
    }
}
