package com.interview.compiler.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class CodeService {

    private final String PISTON_URL = "http://localhost:2000/api/v2/execute";

    public Map<String, String> handleFullFlow(String userCode) {
        // 1. Get Optimized Code from AI
        // We will just echo it for now, since optimization is usually part of the final
        // report,
        // not live execution in standard LeetCode interfaces.
        String optimizedCode = userCode == null ? "" : userCode;

        // 2. Prepare Piston Request
        Map<String, Object> pistonRequest = Map.of(
                "language", "java",
                "version", "15.0.2",
                "files", List.of(Map.of("name", "Main.java", "content", optimizedCode)));

        // 3. Run on Local Piston
        try {
            RestTemplate restTemplate = new RestTemplate();
            String output = restTemplate.postForObject(PISTON_URL, pistonRequest, String.class);
            return Map.of("optimized", optimizedCode, "output", output != null ? output : "No output from Piston");
        } catch (Exception e) {
            return Map.of("optimized", optimizedCode, "error", "Execution failed: " + e.getMessage());
        }
    }
}
