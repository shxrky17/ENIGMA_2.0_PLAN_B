package com.interview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.dto.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

@Service
public class AiService {

  private static final Logger log = Logger.getLogger(AiService.class.getName());

  @Value("${ai.api.key}")
  private String apiKey;

  @Value("${ai.api.url}")
  private String apiUrl;

  private final WebClient webClient = WebClient.builder().build();
  private final ObjectMapper mapper = new ObjectMapper();

  // ── Core Gemini call ─────────────────────────────────────────────────────
  public String callGemini(String prompt) {
    if (apiKey.equals("YOUR_GEMINI_API_KEY_HERE") || apiKey.isBlank()) {
      log.warning("Gemini API key not set — returning mock response");
      return getMockResponse(prompt);
    }
    try {
      Map<String, Object> body = Map.of(
          "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))));
      String url = apiUrl + "?key=" + apiKey;
      String response = webClient.post()
          .uri(url)
          .header("Content-Type", "application/json")
          .bodyValue(body)
          .retrieve()
          .bodyToMono(String.class)
          .block();
      JsonNode node = mapper.readTree(response);
      return node.at("/candidates/0/content/parts/0/text").asText();
    } catch (Exception e) {
      log.severe("Gemini API call failed: " + e.getMessage());
      return getMockResponse(prompt);
    }
  }

  // ── Resume skill extraction ───────────────────────────────────────────────
  public ResumeProfileDTO extractResumeProfile(String resumeText) {
    String prompt = """
        Extract the following from the resume text and return ONLY a valid JSON object (no markdown, no extra text):
        {
          "name": "candidate name",
          "experience": "X years",
          "education": "degree and institution",
          "skillCategories": [
            { "category": "Languages", "color": "indigo", "skills": ["Java", "Python"] },
            { "category": "Frontend", "color": "purple", "skills": ["React", "CSS"] },
            { "category": "Backend", "color": "blue", "skills": ["Spring Boot", "Node.js"] },
            { "category": "DSA & CS", "color": "emerald", "skills": ["Data Structures", "System Design"] }
          ]
        }
        Only include categories that have at least one skill.
        Resume text:
        """ + resumeText.substring(0, Math.min(resumeText.length(), 4000));
    try {
      String json = cleanJson(callGemini(prompt));
      return mapper.readValue(json, ResumeProfileDTO.class);
    } catch (Exception e) {
      log.severe("Profile extraction failed: " + e.getMessage());
      return buildMockProfile();
    }
  }

  // ── Follow-up question generation ─────────────────────────────────────────
  public String generateFollowUp(String questionText, String candidateAnswer, String skill) {
    String prompt = String.format(
        """
            You are a technical interviewer. Given this question and the candidate's answer, generate ONE short follow-up question.
            Return ONLY the follow-up question text, nothing else.
            Skill area: %s
            Original question: %s
            Candidate answered: %s
            """,
        skill, questionText, candidateAnswer);
    return callGemini(prompt).trim();
  }

  // ── Full interview report generation ─────────────────────────────────────
  public String generateReportJson(String transcript, List<String> skills, String difficulty) {
    String prompt = String.format("""
        You are an expert technical interviewer. Analyse this interview transcript and generate a JSON report.
        Return ONLY valid JSON (no markdown fences), with exactly this structure:
        {
          "technicalScore": <0-100>,
          "communicationScore": <0-100>,
          "logicalReasoningScore": <0-100>,
          "problemSpeedScore": <0-100>,
          "aiSummary": "2-3 sentence overall summary",
          "technicalBreakdown": [
            {"label": "Code Correctness", "score": <0-100>, "max": 100, "note": "brief note"},
            {"label": "Time Complexity", "score": <0-100>, "max": 100, "note": "brief note"},
            {"label": "Space Complexity", "score": <0-100>, "max": 100, "note": "brief note"},
            {"label": "Code Readability", "score": <0-100>, "max": 100, "note": "brief note"},
            {"label": "Edge Case Handling", "score": <0-100>, "max": 100, "note": "brief note"},
            {"label": "Best Practices", "score": <0-100>, "max": 100, "note": "brief note"}
          ],
          "communicationBreakdown": [
            {"label": "Problem Articulation", "score": <0-100>, "max": 100, "note": "brief note"},
            {"label": "Thought Narration", "score": <0-100>, "max": 100, "note": "brief note"},
            {"label": "Technical Vocabulary", "score": <0-100>, "max": 100, "note": "brief note"},
            {"label": "Response to Follow-ups", "score": <0-100>, "max": 100, "note": "brief note"},
            {"label": "Confidence & Clarity", "score": <0-100>, "max": 100, "note": "brief note"},
            {"label": "Active Listening", "score": <0-100>, "max": 100, "note": "brief note"}
          ],
          "logicalSteps": [
            {"phase": "Problem Understanding", "rating": <1-5>, "detail": "observation"},
            {"phase": "Initial Approach", "rating": <1-5>, "detail": "observation"},
            {"phase": "Optimization", "rating": <1-5>, "detail": "observation"},
            {"phase": "Code Implementation", "rating": <1-5>, "detail": "observation"},
            {"phase": "Communication", "rating": <1-5>, "detail": "observation"}
          ],
          "strengths": ["strength1", "strength2", "strength3"],
          "improvements": ["improvement1", "improvement2"],
          "followUpQuestions": [
            {"question": "...", "difficulty": "Medium", "topic": "DSA"},
            {"question": "...", "difficulty": "Hard", "topic": "System Design"},
            {"question": "...", "difficulty": "Easy", "topic": "Concepts"}
          ]
        }
        Candidate skills: %s
        Difficulty level: %s
        Interview transcript:
        %s
        """, String.join(", ", skills), difficulty,
        transcript.substring(0, Math.min(transcript.length(), 6000)));
    return cleanJson(callGemini(prompt));
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  public String cleanJson(String raw) {
    return raw.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();
  }

  private String getMockResponse(String prompt) {
    if (prompt.contains("skillCategories"))
      return buildMockProfileJson();
    if (prompt.contains("follow-up"))
      return "Can you explain the time complexity of that approach in more detail?";
    return getMockReportJson();
  }

  private String buildMockProfileJson() {
    return """
        {"name":"Demo Candidate","experience":"2 years","education":"B.Tech Computer Science",
        "skillCategories":[
          {"category":"Languages","color":"indigo","skills":["Java","JavaScript"]},
          {"category":"Frontend","color":"purple","skills":["React","CSS"]},
          {"category":"Backend","color":"blue","skills":["Spring Boot"]},
          {"category":"DSA & CS","color":"emerald","skills":["Data Structures","Algorithms"]}
        ]}""";
  }

  private String getMockReportJson() {
    return """
        {"technicalScore":85,"communicationScore":82,"logicalReasoningScore":88,"problemSpeedScore":80,
        "aiSummary":"The candidate demonstrated solid problem-solving skills and clear communication.",
        "technicalBreakdown":[
          {"label":"Code Correctness","score":90,"max":100,"note":"Code logic was sound."},
          {"label":"Time Complexity","score":85,"max":100,"note":"Reached O(N) solution."},
          {"label":"Space Complexity","score":80,"max":100,"note":"O(N) space — could be optimized."},
          {"label":"Code Readability","score":88,"max":100,"note":"Clean, structured code."},
          {"label":"Edge Case Handling","score":72,"max":100,"note":"Missed null check."},
          {"label":"Best Practices","score":90,"max":100,"note":"Good naming conventions."}
        ],
        "communicationBreakdown":[
          {"label":"Problem Articulation","score":90,"max":100,"note":"Clearly restated the problem."},
          {"label":"Thought Narration","score":85,"max":100,"note":"Narrated approach well."},
          {"label":"Technical Vocabulary","score":80,"max":100,"note":"Good use of technical terms."},
          {"label":"Response to Follow-ups","score":75,"max":100,"note":"Slightly hesitant under pressure."},
          {"label":"Confidence & Clarity","score":82,"max":100,"note":"Confident overall delivery."},
          {"label":"Active Listening","score":88,"max":100,"note":"Incorporated hints well."}
        ],
        "logicalSteps":[
          {"phase":"Problem Understanding","rating":5,"detail":"Re-stated problem and confirmed edge cases."},
          {"phase":"Initial Approach","rating":3,"detail":"Started with brute force, self-corrected."},
          {"phase":"Optimization","rating":4,"detail":"Reached HashMap solution independently."},
          {"phase":"Code Implementation","rating":4,"detail":"Clean code, all tests passed."},
          {"phase":"Communication","rating":4,"detail":"Good narration throughout."}
        ],
        "strengths":["Strong problem decomposition","Clear technical vocabulary","Self-corrects efficiently"],
        "improvements":["Handle edge cases before coding","More confidence on Big-O under pressure"],
        "followUpQuestions":[
          {"question":"How would you handle duplicates in the array?","difficulty":"Easy","topic":"Arrays"},
          {"question":"Design a rate limiter for this API","difficulty":"Hard","topic":"System Design"},
          {"question":"What is the difference between HashMap and TreeMap?","difficulty":"Medium","topic":"Data Structures"}
        ]}""";
  }

  public ResumeProfileDTO buildMockProfile() {
    return new ResumeProfileDTO(
        "Demo Candidate", "2 years", "B.Tech Computer Science",
        List.of(
            new SkillCategoryDTO("Languages", "indigo", List.of("Java", "JavaScript", "Python")),
            new SkillCategoryDTO("Frontend", "purple", List.of("React", "CSS")),
            new SkillCategoryDTO("Backend", "blue", List.of("Spring Boot")),
            new SkillCategoryDTO("DSA & CS", "emerald", List.of("Data Structures", "Algorithms"))));
  }
}
