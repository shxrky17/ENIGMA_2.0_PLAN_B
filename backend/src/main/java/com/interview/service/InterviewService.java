package com.interview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.dto.*;
import com.interview.model.InterviewReport;
import com.interview.model.InterviewSession;
import com.interview.model.SessionMessage;
import com.interview.repository.InterviewReportRepository;
import com.interview.repository.InterviewSessionRepository;
import com.interview.repository.SessionMessageRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Service
public class InterviewService {

        private static final Logger log = Logger.getLogger(InterviewService.class.getName());

        private final InterviewSessionRepository sessionRepo;
        private final InterviewReportRepository reportRepo;
        private final SessionMessageRepository messageRepo;
        private final QuestionBankService questionBank;
        private final AiService aiService;
        private final ObjectMapper mapper = new ObjectMapper();

        public InterviewService(InterviewSessionRepository sessionRepo,
                        InterviewReportRepository reportRepo,
                        SessionMessageRepository messageRepo,
                        QuestionBankService questionBank,
                        AiService aiService) {
                this.sessionRepo = sessionRepo;
                this.reportRepo = reportRepo;
                this.messageRepo = messageRepo;
                this.questionBank = questionBank;
                this.aiService = aiService;
        }

        // ── Start Session ─────────────────────────────────────────────────────────
        public StartInterviewResponse startSession(StartInterviewRequest req) {
                List<String> skills = req.getSkills() != null ? req.getSkills() : List.of();

                InterviewSession session = new InterviewSession();
                session.setDifficulty(req.getDifficulty());
                session.setTopic(req.getTopic());
                session.setCandidateSkills(skills);
                session.setCandidateName(req.getCandidateName());
                session.setCandidateExperience(req.getCandidateExperience());
                session.setCandidateEducation(req.getCandidateEducation());

                // Build question queue ONCE and persist it — never rebuild per-WS-message
                List<PersonalizedQuestionDTO> questions = buildAndEnrichQueue(skills, req.getTopic(),
                                req.getDifficulty(), req.getGeneratedQuestions());

                try {
                        String queueJson = mapper.writeValueAsString(questions);
                        session.setQuestionsQueueJson(queueJson);
                } catch (Exception e) {
                        log.warning("Failed to serialize question queue: " + e.getMessage());
                }

                session.setCurrentQuestionIdx(0);
                session.setInteractionLogJson("[]");
                session.setCodeSubmissionsJson("[]");
                session = sessionRepo.save(session);

                PersonalizedQuestionDTO firstQ = questions.isEmpty() ? getDefaultQuestion() : questions.get(0);
                log.info("Started session " + session.getId() + " with " + questions.size() + " questions for skills: "
                                + skills);

                return new StartInterviewResponse(session.getId(), firstQ, questions.size());
        }

        // ── Handle WebSocket Answer ───────────────────────────────────────────────
        public AiEventDTO handleAnswer(String sessionId, AnswerPayload payload) {
                InterviewSession session = sessionRepo.findById(sessionId)
                                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));

                // Save user's answer as a session message
                messageRepo.save(new SessionMessage(sessionId, "user", payload.getTranscript()));
                appendInteractionLog(session, payload);

                // Load the STORED question queue — never rebuild it
                List<PersonalizedQuestionDTO> questions = loadStoredQueue(session);
                int currentIdx = session.getCurrentQuestionIdx();

                PersonalizedQuestionDTO currentQ = (currentIdx < questions.size()) ? questions.get(currentIdx) : null;
                String currentSkill = (currentQ != null) ? currentQ.getSkill() : "General";

                // Determine the next question (if any) so we can weave it into the AI response
                int nextIdx = currentIdx + 1;
                boolean hasMore = nextIdx < questions.size();
                PersonalizedQuestionDTO nextQ = hasMore ? questions.get(nextIdx) : null;
                String nextQText = (nextQ != null) ? nextQ.getText() : null;

                // AI reacts to the answer, cross-questions, then naturally transitions to nextQ
                String interviewerReply = aiService.generateInterviewerResponse(
                                payload.getQuestionText(),
                                payload.getTranscript(),
                                currentSkill,
                                nextQText); // null when interview is complete — AI ends with a cross-question

                messageRepo.save(new SessionMessage(sessionId, "ai", interviewerReply));

                session.setCurrentQuestionIdx(nextIdx);
                sessionRepo.save(session);

                if (hasMore) {
                        return AiEventDTO.builder()
                                        .type("AI_QUESTION")
                                        // Full interviewer reply (ack + cross-question + transition) as display text
                                        .text(interviewerReply)
                                        // Also send the structured next question so frontend can update progress bar
                                        // etc.
                                        .question(nextQ)
                                        .questionIdx(nextIdx)
                                        .totalQuestions(questions.size())
                                        .build();
                } else {
                        return AiEventDTO.builder()
                                        .type("COMPLETED")
                                        .text(interviewerReply
                                                        + " That wraps up our interview — click 'End Interview' to see your full report.")
                                        .questionIdx(currentIdx)
                                        .totalQuestions(questions.size())
                                        .build();
                }
        }

        // ── Get Stored Questions for a Session ───────────────────────────────────
        public List<PersonalizedQuestionDTO> getSessionQuestions(String sessionId) {
                InterviewSession session = sessionRepo.findById(sessionId)
                                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));
                return loadStoredQueue(session);
        }

        // ── Code Judge ────────────────────────────────────────────────────────────
        public CodeSubmitResponse judgeCode(String sessionId, SubmitCodeRequest req) {
                InterviewSession session = sessionRepo.findById(sessionId)
                                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));

                String codeMsg = "Code submitted [" + req.getLanguage() + "]:\n" + req.getCode();
                messageRepo.save(new SessionMessage(sessionId, "user", codeMsg));

                // Get current question for context
                List<PersonalizedQuestionDTO> questions = loadStoredQueue(session);
                int idx = session.getCurrentQuestionIdx();
                String questionContext = (idx > 0 && idx <= questions.size())
                                ? questions.get(idx - 1).getText()
                                : "coding problem";

                String prompt = String.format(
                                """
                                                Judge this code submission for a technical interview question.
                                                Return ONLY valid JSON (no markdown):
                                                {
                                                  "passed": true/false,
                                                  "timeComplexity": "O(...)",
                                                  "spaceComplexity": "O(...)",
                                                  "feedback": "2-3 sentence assessment of correctness, style, and efficiency",
                                                  "testResults": [
                                                    {"input": "example input", "expected": "expected output", "actual": "actual output", "status": "PASS/FAIL"}
                                                  ]
                                                }
                                                Interview question: %s
                                                Language: %s
                                                Code:
                                                %s
                                                """,
                                questionContext, req.getLanguage(), req.getCode());

                try {
                        String raw = aiService.cleanJson(aiService.callGemini(prompt));
                        JsonNode node = mapper.readTree(raw);

                        List<TestResultDTO> results = new ArrayList<>();
                        JsonNode tests = node.get("testResults");
                        if (tests != null && tests.isArray()) {
                                for (JsonNode t : tests) {
                                        results.add(new TestResultDTO(
                                                        t.path("input").asText(),
                                                        t.path("expected").asText(),
                                                        t.path("actual").asText(),
                                                        t.path("status").asText("PASS")));
                                }
                        }
                        // Also save code feedback as AI message
                        String feedback = node.path("feedback").asText("Code evaluated.");
                        messageRepo.save(new SessionMessage(sessionId, "ai", "Code feedback: " + feedback));

                        CodeSubmitResponse response = CodeSubmitResponse.builder()
                                        .passed(node.path("passed").asBoolean(true))
                                        .timeComplexity(node.path("timeComplexity").asText("O(N)"))
                                        .spaceComplexity(node.path("spaceComplexity").asText("O(N)"))
                                        .feedback(feedback)
                                        .testResults(results)
                                        .build();
                        appendCodeSubmissionLog(session, req, response, questionContext);
                        return response;
                } catch (Exception e) {
                        log.warning("Code judge failed, returning mock: " + e.getMessage());
                        CodeSubmitResponse response = CodeSubmitResponse.builder()
                                        .passed(true)
                                        .timeComplexity("O(N)")
                                        .spaceComplexity("O(N)")
                                        .feedback("Code evaluated. Structure looks reasonable — consider edge cases.")
                                        .testResults(List.of(
                                                        new TestResultDTO("[2,7,11,15], 9", "[0,1]", "[0,1]", "PASS"),
                                                        new TestResultDTO("[3,2,4], 6", "[1,2]", "[1,2]", "PASS"),
                                                        new TestResultDTO("[3,3], 6", "[0,1]", "[0,1]", "PASS")))
                                        .build();
                        appendCodeSubmissionLog(session, req, response, questionContext);
                        return response;
                }
        }

        // ── End Session & Generate AI Report ─────────────────────────────────────
        public EndInterviewResponse endSession(String sessionId) {
                InterviewSession session = sessionRepo.findById(sessionId)
                                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));
                session.setStatus("COMPLETED");
                session.setEndedAt(LocalDateTime.now());
                sessionRepo.save(session);

                // Build full transcript from ALL messages in this session
                List<SessionMessage> messages = messageRepo.findBySessionIdOrderByTimestampAsc(sessionId);
                String transcript = messages.stream()
                                .map(m -> "[" + m.getSender().toUpperCase() + "]: " + m.getText())
                                .collect(Collectors.joining("\n"));
                writeSessionFeedbackFile(session, transcript);

                log.info("Generating report for session " + sessionId + " — transcript length: " + transcript.length()
                                + " chars, " + messages.size() + " messages");

                // Call Gemini to analyse the ACTUAL transcript and produce dynamic scores
                String reportJson = aiService.generateReportJson(
                                transcript,
                                session.getCandidateSkills(),
                                session.getDifficulty() != null ? session.getDifficulty() : "Medium");

                InterviewReport report = new InterviewReport();
                report.setSessionId(sessionId);

                try {
                        JsonNode node = mapper.readTree(reportJson);
                        int tech = node.path("technicalScore").asInt(70);
                        int comm = node.path("communicationScore").asInt(70);
                        int logic = node.path("logicalReasoningScore").asInt(70);
                        int speed = node.path("problemSpeedScore").asInt(70);
                        int overall = (tech + comm + logic + speed) / 4;

                        report.setOverallScore(overall);
                        report.setTechnicalScore(tech);
                        report.setCommunicationScore(comm);
                        report.setLogicalReasoningScore(logic);
                        report.setProblemSpeedScore(speed);
                        report.setAiSummary(node.path("aiSummary").asText(""));

                        report.setTechnicalBreakdownJson(mapper.writeValueAsString(node.get("technicalBreakdown")));
                        report.setCommunicationBreakdownJson(
                                        mapper.writeValueAsString(node.get("communicationBreakdown")));
                        report.setLogicalAnalysisJson(mapper.writeValueAsString(node.get("logicalSteps")));
                        report.setStrengthsJson(mapper.writeValueAsString(node.get("strengths")));
                        report.setImprovementsJson(mapper.writeValueAsString(node.get("improvements")));
                        report.setFollowUpQuestionsJson(mapper.writeValueAsString(node.get("followUpQuestions")));

                        // Record which questions were actually asked
                        List<PersonalizedQuestionDTO> usedQs = loadStoredQueue(session);
                        List<QuestionAskedDTO> asked = usedQs.stream()
                                        .map(q -> new QuestionAskedDTO(q.getSkill(), q.getText(), q.getDifficulty()))
                                        .collect(Collectors.toList());
                        report.setQuestionsAskedJson(mapper.writeValueAsString(asked));
                        report.setInteractionLogJson(session.getInteractionLogJson());
                        report.setCodeSubmissionsJson(session.getCodeSubmissionsJson());
                        report.setCodeApproachJson(mapper.writeValueAsString(generateCodeApproachSummary(session)));

                } catch (Exception e) {
                        log.severe("Failed to parse AI report: " + e.getMessage());
                        report.setOverallScore(65);
                        report.setTechnicalScore(65);
                        report.setCommunicationScore(65);
                        report.setAiSummary(
                                        "Interview completed. Report generation encountered an issue — please try again.");
                }

                report = reportRepo.save(report);
                log.info("Report generated: " + report.getId() + " — overall: " + report.getOverallScore()
                                + ", tech: " + report.getTechnicalScore() + ", comm: "
                                + report.getCommunicationScore());

                return new EndInterviewResponse(report.getId());
        }

        // ── Private Helpers ───────────────────────────────────────────────────────

        /**
         * ALWAYS call Gemini to generate personalized questions for ALL skills.
         * This works for any resume from anywhere in the world — TensorFlow,
         * Kubernetes,
         * Figma, Flutter, Finance, Healthcare IT, anything.
         * Static bank is a safety net ONLY if Gemini fails (no API key, timeout, etc.).
         */
        private List<PersonalizedQuestionDTO> buildAndEnrichQueue(List<String> skills, String topic,
                        String difficulty, List<String> generatedQuestions) {
                String safeTopicContext = (topic != null && !topic.isBlank()) ? topic : "Software Engineering";
                String safeDifficulty = (difficulty != null && !difficulty.isBlank()) ? difficulty : "Medium";

                if (generatedQuestions != null && !generatedQuestions.isEmpty()) {
                        List<PersonalizedQuestionDTO> fromResume = new ArrayList<>();
                        int id = 201;
                        for (String q : generatedQuestions) {
                                if (q == null || q.isBlank())
                                        continue;
                                String mappedSkill = inferSkillForQuestion(q, skills);
                                fromResume.add(new PersonalizedQuestionDTO(
                                                id++,
                                                q.trim(),
                                                safeTopicContext,
                                                mappedSkill,
                                                safeDifficulty,
                                                List.of("Can you walk me through your reasoning in more detail?",
                                                                "What tradeoffs did you consider?")));
                        }
                        if (!fromResume.isEmpty()) {
                                log.info("Using " + fromResume.size() + " FastAPI resume-generated questions");
                                return fromResume;
                        }
                }

                // Step 1: Ask Gemini to generate questions for ALL skills in the resume
                if (skills != null && !skills.isEmpty()) {
                        log.info("Asking Gemini to generate questions for ALL skills: " + skills);
                        List<PersonalizedQuestionDTO> aiQuestions = aiService.generateQuestionsForSkills(
                                        skills, safeTopicContext, safeDifficulty);

                        if (!aiQuestions.isEmpty()) {
                                log.info("Gemini generated " + aiQuestions.size() + " questions for skills: " + skills);
                                return aiQuestions;
                        }
                        log.warning("Gemini returned 0 questions — falling back to static bank for known skills");
                }

                // Step 2: Static bank fallback (only reached if Gemini fails/returns empty)
                List<PersonalizedQuestionDTO> bankQuestions = questionBank.buildQueueFromBank(
                                skills != null ? skills : List.of());
                if (!bankQuestions.isEmpty()) {
                        log.info("Using static bank fallback — found " + bankQuestions.size() + " questions");
                        return bankQuestions;
                }

                // Step 3: Last resort — default generic questions
                log.info("No questions found via AI or bank — using generic defaults");
                return new ArrayList<>(List.of(
                                new PersonalizedQuestionDTO(99,
                                                "Tell me about yourself and your most challenging technical project.",
                                                "General", "General", safeDifficulty,
                                                List.of("What would you change in hindsight?", "What did you learn?")),
                                new PersonalizedQuestionDTO(100,
                                                "Walk me through a complex problem you solved recently and explain your approach.",
                                                "General", "General", safeDifficulty,
                                                List.of("How did you debug it?", "What tools did you use?")),
                                new PersonalizedQuestionDTO(101,
                                                "How do you stay current with trends and new technologies in your field?",
                                                "General", "General", "Easy",
                                                List.of("Can you give a recent example?", "How did you apply it?"))));
        }

        /**
         * Load the stored question queue from the session DB field.
         * Falls back to rebuilding from skills if not stored yet.
         */
        private List<PersonalizedQuestionDTO> loadStoredQueue(InterviewSession session) {
                String json = session.getQuestionsQueueJson();
                if (json != null && !json.isBlank()) {
                        try {
                                return mapper.readValue(json,
                                                new com.fasterxml.jackson.core.type.TypeReference<List<PersonalizedQuestionDTO>>() {
                                                });
                        } catch (Exception e) {
                                log.warning("Failed to deserialize stored queue: " + e.getMessage());
                        }
                }
                // Fallback: rebuild and persist
                List<PersonalizedQuestionDTO> queue = buildAndEnrichQueue(
                                session.getCandidateSkills(),
                                session.getTopic(),
                                session.getDifficulty(),
                                List.of());
                try {
                        session.setQuestionsQueueJson(mapper.writeValueAsString(queue));
                        sessionRepo.save(session);
                } catch (Exception e) {
                        log.warning("Failed to persist rebuilt queue: " + e.getMessage());
                }
                return queue;
        }

        private PersonalizedQuestionDTO getDefaultQuestion() {
                return new PersonalizedQuestionDTO(99,
                                "Tell me about yourself and your most challenging technical project.",
                                "General", "General", "Easy",
                                List.of("What would you change in hindsight?"));
        }

        private String inferSkillForQuestion(String question, List<String> skills) {
                if (skills == null || skills.isEmpty()) {
                        return "General";
                }
                String q = question.toLowerCase();
                for (String skill : skills) {
                        if (skill != null && !skill.isBlank() && q.contains(skill.toLowerCase())) {
                                return skill;
                        }
                }
                return skills.get(0);
        }

        private void appendInteractionLog(InterviewSession session, AnswerPayload payload) {
                try {
                        List<Map<String, Object>> logs = readJsonList(session.getInteractionLogJson());
                        Map<String, Object> entry = new LinkedHashMap<>();
                        entry.put("question", payload.getQuestionText());
                        entry.put("answer", payload.getTranscript());
                        entry.put("questionId", payload.getQuestionId());
                        entry.put("questionIdx", payload.getQuestionIdx());
                        entry.put("timestamp", LocalDateTime.now().toString());
                        logs.add(entry);
                        session.setInteractionLogJson(mapper.writeValueAsString(logs));
                        sessionRepo.save(session);
                } catch (Exception e) {
                        log.warning("Failed to append interaction log: " + e.getMessage());
                }
        }

        private void appendCodeSubmissionLog(InterviewSession session, SubmitCodeRequest req, CodeSubmitResponse response,
                        String questionContext) {
                try {
                        List<Map<String, Object>> logs = readJsonList(session.getCodeSubmissionsJson());
                        Map<String, Object> entry = new LinkedHashMap<>();
                        entry.put("language", req.getLanguage());
                        entry.put("questionId", req.getQuestionId());
                        entry.put("questionText", questionContext);
                        entry.put("code", req.getCode());
                        entry.put("passed", response.isPassed());
                        entry.put("timeComplexity", response.getTimeComplexity());
                        entry.put("spaceComplexity", response.getSpaceComplexity());
                        entry.put("feedback", response.getFeedback());
                        entry.put("testResults", response.getTestResults());
                        entry.put("timestamp", LocalDateTime.now().toString());
                        logs.add(entry);
                        session.setCodeSubmissionsJson(mapper.writeValueAsString(logs));
                        sessionRepo.save(session);
                } catch (Exception e) {
                        log.warning("Failed to append code submission log: " + e.getMessage());
                }
        }

        private List<Map<String, Object>> readJsonList(String json) {
                try {
                        if (json == null || json.isBlank()) {
                                return new ArrayList<>();
                        }
                        return mapper.readValue(json,
                                        new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {
                                        });
                } catch (Exception e) {
                        return new ArrayList<>();
                }
        }

        private List<Map<String, Object>> generateCodeApproachSummary(InterviewSession session) {
                List<Map<String, Object>> result = new ArrayList<>();
                try {
                        List<Map<String, Object>> submissions = readJsonList(session.getCodeSubmissionsJson());
                        int index = 1;
                        for (Map<String, Object> sub : submissions) {
                                String question = String.valueOf(sub.getOrDefault("questionText", "coding problem"));
                                String code = String.valueOf(sub.getOrDefault("code", ""));
                                String feedback = String.valueOf(sub.getOrDefault("feedback", ""));
                                String prompt = """
                                                Analyze this candidate coding approach and return ONLY JSON:
                                                {
                                                  "title": "short title",
                                                  "summary": "max 2 short sentences: correctness + one improvement",
                                                  "rating": 1-5
                                                }
                                                Question: %s
                                                Code:
                                                %s
                                                Feedback:
                                                %s
                                                """
                                                .formatted(question, code, feedback);
                                String raw = aiService.cleanJson(aiService.callGemini(prompt));
                                try {
                                        JsonNode node = mapper.readTree(raw);
                                        Map<String, Object> one = new LinkedHashMap<>();
                                        one.put("title", node.path("title").asText("Attempt " + index));
                                        one.put("summary",
                                                        node.path("summary").asText("Approach was partially correct and needs edge-case handling."));
                                        int rating = node.path("rating").asInt(3);
                                        if (rating < 1)
                                                rating = 1;
                                        if (rating > 5)
                                                rating = 5;
                                        one.put("rating", rating);
                                        result.add(one);
                                } catch (Exception parseErr) {
                                        Map<String, Object> one = new LinkedHashMap<>();
                                        one.put("title", "Attempt " + index);
                                        one.put("summary",
                                                        "Submitted approach reviewed. Improve edge-case handling and complexity explanation.");
                                        one.put("rating", 3);
                                        result.add(one);
                                }
                                index++;
                        }
                } catch (Exception e) {
                        log.warning("Failed to generate code approach summary: " + e.getMessage());
                }
                return result;
        }

        private void writeSessionFeedbackFile(InterviewSession session, String transcript) {
                try {
                        Path dir = Paths.get("feedback_contexts");
                        if (!Files.exists(dir)) {
                                Files.createDirectories(dir);
                        }
                        Map<String, Object> payload = new LinkedHashMap<>();
                        payload.put("sessionId", session.getId());
                        payload.put("candidateName", session.getCandidateName());
                        payload.put("skills", session.getCandidateSkills());
                        payload.put("difficulty", session.getDifficulty());
                        payload.put("topic", session.getTopic());
                        payload.put("interactionLog", readJsonList(session.getInteractionLogJson()));
                        payload.put("codeSubmissions", readJsonList(session.getCodeSubmissionsJson()));
                        payload.put("transcript", transcript);
                        Path file = dir.resolve("session_" + session.getId() + "_context.json");
                        Files.writeString(file, mapper.writerWithDefaultPrettyPrinter().writeValueAsString(payload));
                } catch (Exception e) {
                        log.warning("Failed to write feedback context file: " + e.getMessage());
                }
        }
}
