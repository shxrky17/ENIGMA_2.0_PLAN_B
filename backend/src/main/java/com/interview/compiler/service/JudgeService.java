package com.interview.compiler.service;

import com.interview.compiler.model.CodeRequest;
import com.interview.compiler.model.JudgeResult;
import com.interview.compiler.model.TestCase;
import com.interview.compiler.model.TestCaseResult;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class JudgeService {
    private static final String PISTON_URL = "http://localhost:2000/api/v2/execute";
    private static final String DEFAULT_LANGUAGE = "java";
    private static final String DEFAULT_VERSION = "15.0.2";

    public JudgeResult evaluate(CodeRequest request) {
        validate(request);
        RestTemplate restTemplate = new RestTemplate();
        List<TestCaseResult> testCaseResults = new ArrayList<>();
        int passedCount = 0;
        String language = normalize(request.getLanguage(), DEFAULT_LANGUAGE);

        for (int i = 0; i < request.getTestCases().size(); i++) {
            TestCase tc = request.getTestCases().get(i);
            Map<String, Object> payload = Map.of(
                    "language", language,
                    "version", DEFAULT_VERSION,
                    "files", List.of(Map.of("name", "Main.java", "content", request.getCode())),
                    "stdin", normalize(tc.getInput(), ""));

            TestCaseResult one = new TestCaseResult();
            one.setIndex(i + 1);
            one.setInput(normalize(tc.getInput(), ""));
            one.setExpectedOutput(normalize(tc.getExpectedOutput(), ""));

            try {
                Map<String, Object> response = restTemplate.postForObject(PISTON_URL, payload, Map.class);
                if (response == null || !response.containsKey("run")) {
                    one.setPassed(false);
                    one.setActualOutput("");
                    one.setError("No response from execution engine");
                    testCaseResults.add(one);
                    continue;
                }

                @SuppressWarnings("unchecked")
                Map<String, Object> run = (Map<String, Object>) response.get("run");
                String stdout = normalize((String) run.get("stdout"), "");
                String stderr = normalize((String) run.get("stderr"), "");
                String compileOutput = normalize((String) run.get("output"), "");

                String expectedOutput = one.getExpectedOutput().trim();

                // Piston sometimes includes trailing newlines, so we trim
                String actualOutput = stdout.trim();

                one.setActualOutput(actualOutput);
                if (stderr != null && !stderr.isBlank()) {
                    one.setError(stderr);
                } else if (compileOutput != null && !compileOutput.isBlank() && actualOutput.isBlank()) {
                    // Sometimes compilation errors come in 'output'
                    one.setError(compileOutput);
                }

                boolean passed = one.getError() == null && actualOutput.equals(expectedOutput);
                one.setPassed(passed);
                if (passed) {
                    passedCount++;
                }
            } catch (Exception e) {
                one.setPassed(false);
                one.setError("Execution Error: " + e.getMessage());
            }

            testCaseResults.add(one);
        }

        JudgeResult result = new JudgeResult();
        result.setPassed(passedCount > 0 && passedCount == testCaseResults.size());
        result.setPassedCount(passedCount);
        result.setTotalCount(testCaseResults.size());
        result.setResults(testCaseResults);
        result.setMessage(result.isPassed() ? "Accepted" : "Wrong Answer");
        return result;
    }

    private void validate(CodeRequest request) {
        if (request == null || request.getCode() == null || request.getCode().isBlank()) {
            throw new IllegalArgumentException("Code is required");
        }
        if (request.getTestCases() == null || request.getTestCases().isEmpty()) {
            throw new IllegalArgumentException("At least one test case is required");
        }
    }

    private String normalize(String value, String fallback) {
        return value == null ? fallback : value;
    }
}
