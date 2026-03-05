package com.interview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.dto.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;
import java.util.logging.Logger;

@Service
public class AiService {

  private static final Logger log = Logger.getLogger(AiService.class.getName());
  private static final Random RAND = new Random();

  @Value("${ai.api.key}")
  private String apiKey;

  @Value("${ai.api.url}")
  private String apiUrl;

  private final HttpClient http = HttpClient.newBuilder()
      .connectTimeout(Duration.ofSeconds(15))
      .build();
  private final ObjectMapper mapper = new ObjectMapper();

  // ── Core Gemini call ─────────────────────────────────────────────────────
  public String callGemini(String prompt) {
    if (apiKey == null || apiKey.isBlank() || apiKey.equals("YOUR_GEMINI_API_KEY_HERE")) {
      log.warning("Gemini API key not set — returning mock response");
      return getMockResponse(prompt);
    }
    try {
      String bodyJson = mapper.writeValueAsString(
          Map.of("contents", List.of(
              Map.of("parts", List.of(Map.of("text", prompt))))));

      String url = apiUrl + "?key=" + apiKey;
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(url))
          .header("Content-Type", "application/json")
          .timeout(Duration.ofSeconds(30))
          .POST(HttpRequest.BodyPublishers.ofString(bodyJson))
          .build();

      HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());

      if (response.statusCode() == 200) {
        JsonNode node = mapper.readTree(response.body());
        String text = node.at("/candidates/0/content/parts/0/text").asText("");
        if (!text.isBlank())
          return text;
        log.warning("Gemini returned empty text. Full response: "
            + response.body().substring(0, Math.min(300, response.body().length())));
      } else {
        log.severe("Gemini HTTP " + response.statusCode() + ": "
            + response.body().substring(0, Math.min(500, response.body().length())));
      }
    } catch (Exception e) {
      log.severe("Gemini API call failed: " + e.getMessage());
    }
    return getMockResponse(prompt);
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
        Only include categories that have at least one skill. Extract ALL skills mentioned.
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

  // ── AI Question Generation for any skill globally ───────────────────────────
  public List<PersonalizedQuestionDTO> generateQuestionsForSkills(
      List<String> skills, String topic, String difficulty) {

    List<String> capped = skills.size() > 8 ? skills.subList(0, 8) : skills;

    String prompt = String.format("""
        You are an expert technical interviewer conducting a %s-difficulty interview for: %s.
        The candidate's resume lists these skills: %s.

        Generate exactly ONE interview question per skill listed above.
        Return ONLY a valid JSON array. No markdown, no explanation, no code fences.
        Each object must have exactly these fields:
        [
          {
            "id": 201,
            "text": "A clear, specific question about this skill",
            "topic": "%s",
            "skill": "the exact skill name from the list",
            "difficulty": "%s",
            "followUps": ["follow-up 1", "follow-up 2"]
          }
        ]
        RULES:
        - Each question MUST be specific to that skill (not generic)
        - Works for ANY skill: programming, cloud, design, data science, finance, HR, etc.
        - Difficulty MUST be exactly one of: Easy, Medium, Hard
        - IDs start from 201 and increment
        - Return the raw JSON array only
        """,
        difficulty, topic, String.join(", ", capped), topic, difficulty);
    try {
      String raw = cleanJson(callGemini(prompt));
      JsonNode arr = mapper.readTree(raw);
      List<PersonalizedQuestionDTO> questions = new ArrayList<>();
      if (arr.isArray()) {
        int id = 201;
        for (JsonNode n : arr) {
          List<String> followUps = new ArrayList<>();
          JsonNode fuNode = n.get("followUps");
          if (fuNode != null && fuNode.isArray()) {
            for (JsonNode fu : fuNode)
              followUps.add(fu.asText());
          }
          String text = n.path("text").asText("");
          if (!text.isBlank()) {
            questions.add(new PersonalizedQuestionDTO(
                n.path("id").asInt(id++), text,
                n.path("topic").asText(topic),
                n.path("skill").asText(capped.get(0)),
                n.path("difficulty").asText(difficulty),
                followUps));
          }
        }
      }
      log.info("AI generated " + questions.size() + " questions for: " + capped);
      return questions;
    } catch (Exception e) {
      log.warning("AI question generation failed: " + e.getMessage());
      return List.of();
    }
  }

  // ── Real interviewer response: judge + cross-question + transition ───────────
  public String generateInterviewerResponse(
      String questionText, String candidateAnswer,
      String skill, String nextQuestionText) {

    boolean hasNext = nextQuestionText != null && !nextQuestionText.isBlank();
    String snippet = candidateAnswer.length() > 500
        ? candidateAnswer.substring(0, 500) + "..."
        : candidateAnswer;

    String transitionInstruction = hasNext
        ? "Then transition to the next topic: \"" + nextQuestionText + "\""
        : "End after your cross-question.";

    String prompt = String.format("""
        You are a real technical interviewer. React to the candidate's answer like a thoughtful human.
        Speak naturally — 3 to 5 sentences. NO bullet points. NO labels. Just flowing spoken conversation.

        Question asked: %s
        Skill being tested: %s
        Candidate said: "%s"

        Your response must flow as ONE natural paragraph with these 3 beats:
        1. SPECIFIC ACKNOWLEDGMENT: React to their actual words. Reference what they said.
           "Good, you correctly identified X..." or "That's a start, though you skipped Y..."
        2. SHARP CROSS-QUESTION: Challenge them on one specific thing from their answer.
           "You mentioned X — what if Y? How does that change things?"
           "Walk me through the time/space complexity of that specific approach."
        3. %s

        Write as you would speak aloud. Be concise and natural.
        """, questionText, skill, snippet, transitionInstruction);

    String r = callGemini(prompt).trim();
    if (r.isBlank()) {
      // Dynamic fallback varies by skill and next question
      String crossQ = generateDynamicCrossQuestion(skill, candidateAnswer);
      return hasNext
          ? "You mentioned some key points about " + skill + ". " + crossQ + " Alright, moving on — " + nextQuestionText
          : "You've covered some ground on " + skill + ". " + crossQ;
    }
    return r;
  }

  /** Generates a sensible cross-question by looking at the answer content */
  private String generateDynamicCrossQuestion(String skill, String answer) {
    String lower = answer.toLowerCase();
    String[] probes = {
        "Can you walk me through the time and space complexity of that approach for " + skill + "?",
        "You mentioned " + skill + " — how would you handle edge cases like null inputs or empty collections?",
        "What trade-offs did you consider when choosing that approach for " + skill + "?",
        "How would you test that " + skill + " implementation to ensure it handles all edge cases?",
        "If this solution needed to scale to millions of records, how would you adapt your " + skill + " approach?",
        "What alternative approaches did you consider for " + skill + " before settling on this one?",
    };
    if (lower.contains("o(n)") || lower.contains("hash") || lower.contains("map"))
      return "Can you explain why a HashMap was optimal here and what the space complexity trade-off is?";
    if (lower.contains("recurs") || lower.contains("stack") || lower.contains("dfs") || lower.contains("bfs"))
      return "How deep could the recursion go for large inputs, and how would you avoid a stack overflow?";
    if (lower.contains("sort") || lower.contains("o(n log"))
      return "Is sorting always O(N log N) here, or does the input distribution change that? Can you think of a case where you'd avoid sorting?";
    if (lower.contains("interface") || lower.contains("abstract") || lower.contains("inherit"))
      return "Can you think of a real project scenario where choosing the wrong one between interface and abstract class would cause issues?";
    return probes[RAND.nextInt(probes.length)];
  }

  // ── Generate more follow-up questions for a report ───────────────────────
  public List<FollowUpQuestionDTO> generateMoreFollowUps(List<String> skills, String difficulty) {
    String prompt = String.format("""
        You are an expert technical interviewer. Generate 3 challenging follow-up interview questions.
        Return ONLY a valid JSON array (no markdown):
        [
          {"question": "...", "difficulty": "Easy/Medium/Hard", "topic": "topic name"}
        ]
        Skills: %s
        Difficulty: %s
        Make questions specific to the skills listed and progressively challenging.
        """, String.join(", ", skills), difficulty);
    try {
      String raw = cleanJson(callGemini(prompt));
      JsonNode arr = mapper.readTree(raw);
      List<FollowUpQuestionDTO> result = new ArrayList<>();
      if (arr.isArray()) {
        for (JsonNode n : arr) {
          result.add(new FollowUpQuestionDTO(
              n.path("question").asText(),
              n.path("difficulty").asText("Medium"),
              n.path("topic").asText("General")));
        }
      }
      return result;
    } catch (Exception e) {
      log.warning("Generate more follow-ups failed: " + e.getMessage());
      return getMockFollowUps(skills);
    }
  }

  // ── Full interview report generation ─────────────────────────────────────
  public String generateReportJson(String transcript, List<String> skills, String difficulty) {
    String prompt = String.format(
        """
            You are an expert technical interviewer. Analyse this interview transcript and generate a JSON report.
            Return ONLY valid JSON (no markdown fences):
            {
              "technicalScore": <0-100>,
              "communicationScore": <0-100>,
              "logicalReasoningScore": <0-100>,
              "problemSpeedScore": <0-100>,
              "aiSummary": "2-3 sentence summary referencing specific answers given",
              "technicalBreakdown": [
                {"label": "Code Correctness", "score": <0-100>, "max": 100, "note": "specific note"},
                {"label": "Time Complexity", "score": <0-100>, "max": 100, "note": "specific note"},
                {"label": "Space Complexity", "score": <0-100>, "max": 100, "note": "specific note"},
                {"label": "Code Readability", "score": <0-100>, "max": 100, "note": "specific note"},
                {"label": "Edge Case Handling", "score": <0-100>, "max": 100, "note": "specific note"},
                {"label": "Best Practices", "score": <0-100>, "max": 100, "note": "specific note"}
              ],
              "communicationBreakdown": [
                {"label": "Problem Articulation", "score": <0-100>, "max": 100, "note": "specific note"},
                {"label": "Thought Narration", "score": <0-100>, "max": 100, "note": "specific note"},
                {"label": "Technical Vocabulary", "score": <0-100>, "max": 100, "note": "specific note"},
                {"label": "Response to Follow-ups", "score": <0-100>, "max": 100, "note": "specific note"},
                {"label": "Confidence & Clarity", "score": <0-100>, "max": 100, "note": "specific note"},
                {"label": "Active Listening", "score": <0-100>, "max": 100, "note": "specific note"}
              ],
              "logicalSteps": [
                {"phase": "Problem Understanding", "rating": <1-5>, "detail": "observation from transcript"},
                {"phase": "Initial Approach", "rating": <1-5>, "detail": "observation from transcript"},
                {"phase": "Optimization", "rating": <1-5>, "detail": "observation from transcript"},
                {"phase": "Code Implementation", "rating": <1-5>, "detail": "observation from transcript"},
                {"phase": "Communication", "rating": <1-5>, "detail": "observation from transcript"}
              ],
              "strengths": ["specific strength", "specific strength"],
              "improvements": ["specific improvement", "specific improvement"],
              "followUpQuestions": [
                {"question": "...", "difficulty": "Medium", "topic": "skill topic"},
                {"question": "...", "difficulty": "Hard", "topic": "skill topic"},
                {"question": "...", "difficulty": "Easy", "topic": "skill topic"}
              ]
            }
            IMPORTANT: ALL scores MUST be based on what the candidate ACTUALLY said. Short answers = low scores (20-50). Detailed correct answers = high scores (80-95).
            Candidate skills: %s | Difficulty: %s
            Transcript:
            %s
            """,
        String.join(", ", skills), difficulty,
        transcript.substring(0, Math.min(transcript.length(), 6000)));
    return cleanJson(callGemini(prompt));
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  public String cleanJson(String raw) {
    if (raw == null)
      return "{}";
    return raw.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();
  }

  private String getMockResponse(String prompt) {
    if (prompt.contains("skillCategories"))
      return buildMockProfileJson();
    if (prompt.contains("BEAT 2") || prompt.contains("BEAT 1") || prompt.contains("transition to the next topic"))
      return ""; // let generateInterviewerResponse use dynamic fallback
    if (prompt.contains("generate 3 challenging") || prompt.contains("Generate 3 challenging"))
      return buildMockFollowUpsJson();
    if (prompt.contains("JSON array") && prompt.contains("id"))
      return "[]";
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

  private String buildMockFollowUpsJson() {
    return """
        [
          {"question":"How would you improve the time complexity of your solution?","difficulty":"Medium","topic":"Algorithms"},
          {"question":"Design a system that handles 10 million requests per day.","difficulty":"Hard","topic":"System Design"},
          {"question":"Explain the difference between stack and queue with a real-world example.","difficulty":"Easy","topic":"Data Structures"}
        ]""";
  }

  private String getMockReportJson() {
    int tech = 65 + RAND.nextInt(30);
    int comm = 60 + RAND.nextInt(30);
    int logic = 62 + RAND.nextInt(30);
    int speed = 58 + RAND.nextInt(30);
    return String.format(
        """
            {"technicalScore":%d,"communicationScore":%d,"logicalReasoningScore":%d,"problemSpeedScore":%d,
            "aiSummary":"The candidate demonstrated moderate proficiency across the assessed skills.",
            "technicalBreakdown":[
              {"label":"Code Correctness","score":%d,"max":100,"note":"Partial implementation."},
              {"label":"Time Complexity","score":%d,"max":100,"note":"Basic approach used."},
              {"label":"Space Complexity","score":%d,"max":100,"note":"Could be optimized."},
              {"label":"Code Readability","score":%d,"max":100,"note":"Structure acceptable."},
              {"label":"Edge Case Handling","score":%d,"max":100,"note":"Some cases missed."},
              {"label":"Best Practices","score":%d,"max":100,"note":"Standard practices followed."}
            ],
            "communicationBreakdown":[
              {"label":"Problem Articulation","score":%d,"max":100,"note":"Partial restatement."},
              {"label":"Thought Narration","score":%d,"max":100,"note":"Some narration."},
              {"label":"Technical Vocabulary","score":%d,"max":100,"note":"Basic terms used."},
              {"label":"Response to Follow-ups","score":%d,"max":100,"note":"Brief responses."},
              {"label":"Confidence & Clarity","score":%d,"max":100,"note":"Moderate confidence."},
              {"label":"Active Listening","score":%d,"max":100,"note":"Responded partially."}
            ],
            "logicalSteps":[
              {"phase":"Problem Understanding","rating":%d,"detail":"Basic requirements understood."},
              {"phase":"Initial Approach","rating":%d,"detail":"Started with a direct approach."},
              {"phase":"Optimization","rating":%d,"detail":"Limited optimization attempted."},
              {"phase":"Code Implementation","rating":%d,"detail":"Partially complete."},
              {"phase":"Communication","rating":%d,"detail":"Moderate communication."}
            ],
            "strengths":["Problem understanding","Willingness to attempt","Core concept familiarity"],
            "improvements":["Explain thought process clearly","Handle edge cases first","Improve optimization"],
            "followUpQuestions":[
              {"question":"Walk me through a more optimal solution step by step.","difficulty":"Medium","topic":"Algorithms"},
              {"question":"How would you scale this to millions of users?","difficulty":"Hard","topic":"System Design"},
              {"question":"What data structure fits this problem best and why?","difficulty":"Easy","topic":"DSA"}
            ]}""",
        tech, comm, logic, speed,
        cap(tech + RAND.nextInt(10) - 5), cap(tech - 5 + RAND.nextInt(10)),
        cap(tech - 10 + RAND.nextInt(10)), cap(tech + RAND.nextInt(10)),
        cap(tech - 15 + RAND.nextInt(15)), cap(tech + RAND.nextInt(10) - 3),
        cap(comm + RAND.nextInt(10) - 5), cap(comm - 5 + RAND.nextInt(10)),
        cap(comm - 8 + RAND.nextInt(10)), cap(comm - 10 + RAND.nextInt(15)),
        cap(comm + RAND.nextInt(10) - 5), cap(comm + RAND.nextInt(10)),
        Math.max(1, Math.min(5, 2 + RAND.nextInt(3))), Math.max(1, Math.min(5, 1 + RAND.nextInt(3))),
        Math.max(1, Math.min(5, 1 + RAND.nextInt(3))), Math.max(1, Math.min(5, 2 + RAND.nextInt(3))),
        Math.max(1, Math.min(5, 2 + RAND.nextInt(3))));
  }

  private int cap(int v) {
    return Math.max(20, Math.min(100, v));
  }

  private List<FollowUpQuestionDTO> getMockFollowUps(List<String> skills) {
    String skill = skills.isEmpty() ? "General" : skills.get(0);
    return List.of(
        new FollowUpQuestionDTO("Optimize your " + skill + " approach for large inputs.", "Medium", skill),
        new FollowUpQuestionDTO("Design a scalable system using " + skill + " principles.", "Hard", "System Design"),
        new FollowUpQuestionDTO("What are common pitfalls when working with " + skill + "?", "Easy", skill));
  }

  public ResumeProfileDTO buildMockProfile() {
    return new ResumeProfileDTO("Demo Candidate", "2 years", "B.Tech Computer Science",
        List.of(
            new SkillCategoryDTO("Languages", "indigo", List.of("Java", "JavaScript", "Python")),
            new SkillCategoryDTO("Frontend", "purple", List.of("React", "CSS")),
            new SkillCategoryDTO("Backend", "blue", List.of("Spring Boot")),
            new SkillCategoryDTO("DSA & CS", "emerald", List.of("Data Structures", "Algorithms"))));
  }
}
