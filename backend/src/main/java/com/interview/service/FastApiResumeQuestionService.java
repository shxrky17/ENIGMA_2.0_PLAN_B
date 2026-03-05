package com.interview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

@Service
public class FastApiResumeQuestionService {
    private static final Logger log = Logger.getLogger(FastApiResumeQuestionService.class.getName());

    @Value("${integration.fastapi.resume.enabled:false}")
    private boolean enabled;

    @Value("${integration.fastapi.resume.url:http://localhost:8000/analyze-resume}")
    private String fastApiUrl;

    private final ObjectMapper mapper = new ObjectMapper();

    public List<String> generateQuestions(MultipartFile file) {
        if (!enabled) {
            return List.of();
        }

        try {
            RestTemplate restTemplate = new RestTemplate();

            HttpHeaders fileHeaders = new HttpHeaders();
            fileHeaders.setContentType(MediaType.APPLICATION_OCTET_STREAM);

            ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename() != null ? file.getOriginalFilename() : "resume.pdf";
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new HttpEntity<>(resource, fileHeaders));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(fastApiUrl, request, String.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                log.warning("FastAPI question generation failed. HTTP status: " + response.getStatusCode());
                return List.of();
            }

            return extractQuestions(response.getBody());
        } catch (Exception e) {
            log.warning("FastAPI question generation failed: " + e.getMessage());
            return List.of();
        }
    }

    private List<String> extractQuestions(String json) {
        List<String> questions = new ArrayList<>();
        try {
            JsonNode root = mapper.readTree(json);

            // Supports both:
            // 1) {"questions":{"questions":["q1","q2"]}}
            // 2) {"questions":["q1","q2"]}
            JsonNode qNode = root.path("questions");
            if (qNode.isObject()) {
                qNode = qNode.path("questions");
            }

            if (qNode.isArray()) {
                for (JsonNode q : qNode) {
                    String value = q.asText("").trim();
                    if (!value.isBlank()) {
                        questions.add(value);
                    }
                }
            }
        } catch (Exception e) {
            log.warning("Failed to parse FastAPI question response: " + e.getMessage());
        }
        return questions;
    }
}

