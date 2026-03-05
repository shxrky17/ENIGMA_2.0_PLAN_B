package com.interview.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.dto.*;
import com.interview.model.InterviewReport;
import com.interview.model.InterviewSession;
import com.interview.repository.InterviewReportRepository;
import com.interview.repository.InterviewSessionRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;

@Service
public class ReportService {

    private static final Logger log = Logger.getLogger(ReportService.class.getName());

    private final InterviewReportRepository reportRepo;
    private final InterviewSessionRepository sessionRepo;
    private final AiService aiService;
    private final ObjectMapper mapper = new ObjectMapper();

    public ReportService(InterviewReportRepository reportRepo,
            InterviewSessionRepository sessionRepo,
            AiService aiService) {
        this.reportRepo = reportRepo;
        this.sessionRepo = sessionRepo;
        this.aiService = aiService;
    }

    public ReportDTO getReport(String reportId) {
        InterviewReport report = reportRepo.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found: " + reportId));
        InterviewSession session = sessionRepo.findById(report.getSessionId())
                .orElseThrow(() -> new RuntimeException("Session not found: " + report.getSessionId()));
        return buildDTO(report, session);
    }

    public List<SessionSummaryDTO> getAllSessions() {
        List<InterviewSession> sessions = sessionRepo.findAllByOrderByStartedAtDesc();
        List<SessionSummaryDTO> result = new ArrayList<>();
        for (InterviewSession s : sessions) {
            Optional<InterviewReport> reportOpt = reportRepo.findBySessionId(s.getId());
            SessionSummaryDTO dto = new SessionSummaryDTO(
                    s.getId(),
                    reportOpt.map(InterviewReport::getId).orElse(null),
                    s.getTopic(),
                    s.getDifficulty(),
                    reportOpt.map(InterviewReport::getOverallScore).orElse(0),
                    reportOpt.map(InterviewReport::getTechnicalScore).orElse(0),
                    reportOpt.map(InterviewReport::getCommunicationScore).orElse(0),
                    s.getStatus(),
                    formatDate(s.getStartedAt()),
                    formatDuration(s.getStartedAt(), s.getEndedAt()),
                    s.getCandidateSkills());
            result.add(dto);
        }
        return result;
    }

    /**
     * Generates additional follow-up questions using AI, based on the session's
     * skills.
     */
    public List<FollowUpQuestionDTO> generateMoreFollowUps(String reportId) {
        InterviewReport report = reportRepo.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found: " + reportId));
        InterviewSession session = sessionRepo.findById(report.getSessionId())
                .orElseThrow(() -> new RuntimeException("Session not found"));

        List<String> skills = session.getCandidateSkills();
        String difficulty = session.getDifficulty() != null ? session.getDifficulty() : "Medium";

        log.info("Generating more follow-ups for report " + reportId + " with skills: " + skills);
        return aiService.generateMoreFollowUps(skills, difficulty);
    }

    private ReportDTO buildDTO(InterviewReport report, InterviewSession session) {
        ScoreBreakdownDTO technical = new ScoreBreakdownDTO(
                report.getTechnicalScore(),
                parseScoreItems(report.getTechnicalBreakdownJson()));
        ScoreBreakdownDTO communication = new ScoreBreakdownDTO(
                report.getCommunicationScore(),
                parseScoreItems(report.getCommunicationBreakdownJson()));
        LogicalAnalysisDTO logicalAnalysis = new LogicalAnalysisDTO(
                report.getAiSummary(),
                parseLogicalSteps(report.getLogicalAnalysisJson()));
        PersonalisationSummaryDTO personalisation = new PersonalisationSummaryDTO(
                session.getCandidateSkills(),
                parseQuestionsAsked(report.getQuestionsAskedJson()));

        return new ReportDTO(
                report.getOverallScore(),
                buildRoleLabel(session),
                formatDate(session.getStartedAt()),
                formatDuration(session.getStartedAt(), session.getEndedAt()),
                technical,
                communication,
                logicalAnalysis,
                parseFollowUps(report.getFollowUpQuestionsJson()),
                parseStringList(report.getStrengthsJson()),
                parseStringList(report.getImprovementsJson()),
                personalisation,
                report.getLogicalReasoningScore(),
                report.getProblemSpeedScore(),
                parseInterviewContext(report.getInteractionLogJson()),
                parseCodeSubmissions(report.getCodeSubmissionsJson()),
                parseCodeApproach(report.getCodeApproachJson()));
    }

    private String buildRoleLabel(InterviewSession session) {
        if (session.getTopic() != null && !session.getTopic().isBlank()) {
            return session.getTopic() + " Interview";
        }
        return "Software Engineer";
    }

    private List<ScoreItemDTO> parseScoreItems(String json) {
        try {
            if (json == null)
                return List.of();
            return mapper.readValue(json, new TypeReference<List<ScoreItemDTO>>() {
            });
        } catch (Exception e) {
            return List.of();
        }
    }

    private List<LogicalStepDTO> parseLogicalSteps(String json) {
        try {
            if (json == null)
                return List.of();
            return mapper.readValue(json, new TypeReference<List<LogicalStepDTO>>() {
            });
        } catch (Exception e) {
            return List.of();
        }
    }

    private List<FollowUpQuestionDTO> parseFollowUps(String json) {
        try {
            if (json == null)
                return List.of();
            return mapper.readValue(json, new TypeReference<List<FollowUpQuestionDTO>>() {
            });
        } catch (Exception e) {
            return List.of();
        }
    }

    private List<String> parseStringList(String json) {
        try {
            if (json == null)
                return List.of();
            return mapper.readValue(json, new TypeReference<List<String>>() {
            });
        } catch (Exception e) {
            return List.of();
        }
    }

    private List<QuestionAskedDTO> parseQuestionsAsked(String json) {
        try {
            if (json == null)
                return List.of();
            return mapper.readValue(json, new TypeReference<List<QuestionAskedDTO>>() {
            });
        } catch (Exception e) {
            return List.of();
        }
    }

    private List<InterviewContextEntryDTO> parseInterviewContext(String json) {
        try {
            if (json == null)
                return List.of();
            return mapper.readValue(json, new TypeReference<List<InterviewContextEntryDTO>>() {
            });
        } catch (Exception e) {
            return List.of();
        }
    }

    private List<CodeSubmissionDTO> parseCodeSubmissions(String json) {
        try {
            if (json == null)
                return List.of();
            return mapper.readValue(json, new TypeReference<List<CodeSubmissionDTO>>() {
            });
        } catch (Exception e) {
            return List.of();
        }
    }

    private List<CodeApproachItemDTO> parseCodeApproach(String json) {
        try {
            if (json == null)
                return List.of();
            return mapper.readValue(json, new TypeReference<List<CodeApproachItemDTO>>() {
            });
        } catch (Exception e) {
            return List.of();
        }
    }

    private String formatDate(LocalDateTime dt) {
        if (dt == null)
            return "N/A";
        return dt.format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"));
    }

    private String formatDuration(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null)
            return "N/A";
        Duration d = Duration.between(start, end);
        long mins = d.toMinutes();
        long secs = d.toSecondsPart();
        return mins + "m " + secs + "s";
    }
}
