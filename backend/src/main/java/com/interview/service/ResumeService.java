package com.interview.service;

import com.interview.dto.ResumeProfileDTO;
import com.interview.dto.SkillCategoryDTO;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ResumeService {

    private static final Logger log = Logger.getLogger(ResumeService.class.getName());

    private final AiService aiService;
    private final FastApiResumeQuestionService fastApiResumeQuestionService;

    public ResumeService(AiService aiService, FastApiResumeQuestionService fastApiResumeQuestionService) {
        this.aiService = aiService;
        this.fastApiResumeQuestionService = fastApiResumeQuestionService;
    }

    public ResumeProfileDTO parseAndExtract(MultipartFile file) throws IOException {
        String rawText = extractText(file);
        log.info("Extracted " + rawText.length() + " characters from resume file: " + file.getOriginalFilename());

        if (rawText.isBlank() || rawText.length() < 50) {
            log.warning("Very short/empty resume text — returning minimal profile");
            return buildFallbackProfile(rawText);
        }

        // Try Gemini first
        ResumeProfileDTO aiProfile = aiService.extractResumeProfile(rawText);
        List<String> generatedQuestions = fastApiResumeQuestionService.generateQuestions(file);

        // Validate AI profile — if skills are empty, use our regex extractor
        long totalSkills = 0;
        if (aiProfile.getSkillCategories() != null) {
            totalSkills = aiProfile.getSkillCategories().stream()
                    .filter(sc -> sc.getSkills() != null)
                    .mapToLong(sc -> sc.getSkills().size())
                    .sum();
        }

        if (totalSkills == 0) {
            log.warning("AI extraction returned no skills — running smart regex extraction");
            ResumeProfileDTO fallback = extractWithRegex(rawText, aiProfile);
            fallback.setGeneratedQuestions(generatedQuestions);
            return fallback;
        }

        log.info("AI extraction successful: " + totalSkills + " skills across "
                + aiProfile.getSkillCategories().size() + " categories");
        aiProfile.setGeneratedQuestions(generatedQuestions);
        return aiProfile;
    }

    // ── Smart Regex Extraction ─────────────────────────────────────────────────
    private ResumeProfileDTO extractWithRegex(String text, ResumeProfileDTO aiProfile) {
        String lower = text.toLowerCase();

        // Known skills grouped by category
        Map<String, List<String>> categoryMap = new LinkedHashMap<>();
        categoryMap.put("Languages|indigo", Arrays.asList(
                "java", "python", "javascript", "typescript", "c++", "c#", "ruby", "go", "kotlin",
                "swift", "rust", "php", "scala", "r", "dart", "matlab", "perl", "bash", "shell"));
        categoryMap.put("Frontend|purple", Arrays.asList(
                "react", "reactjs", "react.js", "angular", "vue", "vuejs", "next.js", "nextjs",
                "html", "css", "sass", "scss", "tailwind", "bootstrap", "jquery", "redux",
                "svelte", "gatsby", "webpack", "vite", "figma", "ui/ux", "material ui"));
        categoryMap.put("Backend|blue", Arrays.asList(
                "spring", "spring boot", "spring mvc", "node.js", "nodejs", "express", "django",
                "flask", "fastapi", "laravel", "rails", "asp.net", "nest.js", "graphql",
                "rest api", "microservices", "kafka", "rabbitmq", "redis"));
        categoryMap.put("Databases|cyan", Arrays.asList(
                "mysql", "postgresql", "mongodb", "sqlite", "oracle", "cassandra", "firebase",
                "dynamodb", "elasticsearch", "neo4j", "redis", "sql server", "mariadb"));
        categoryMap.put("Cloud & DevOps|orange", Arrays.asList(
                "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "jenkins",
                "ci/cd", "terraform", "ansible", "git", "github", "gitlab", "bitbucket",
                "linux", "nginx", "apache", "helm", "prometheus", "grafana"));
        categoryMap.put("DSA & CS|emerald", Arrays.asList(
                "data structures", "algorithms", "dynamic programming", "graph", "binary tree",
                "linked list", "sorting", "system design", "object oriented", "oop",
                "design patterns", "concurrency", "multithreading", "recursion"));
        categoryMap.put("AI & Data|rose", Arrays.asList(
                "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn",
                "pandas", "numpy", "nlp", "computer vision", "data science", "data analysis",
                "power bi", "tableau", "spark", "hadoop", "opencv", "keras"));
        categoryMap.put("Mobile|violet", Arrays.asList(
                "android", "ios", "flutter", "react native", "xamarin", "swift",
                "objective-c", "kotlin", "expo", "cordova"));

        List<SkillCategoryDTO> categories = new ArrayList<>();
        for (Map.Entry<String, List<String>> entry : categoryMap.entrySet()) {
            String[] parts = entry.getKey().split("\\|");
            String catName = parts[0];
            String color = parts[1];
            List<String> found = new ArrayList<>();
            for (String skill : entry.getValue()) {
                if (lower.contains(skill.toLowerCase())) {
                    // Capitalize properly
                    found.add(properCase(skill));
                }
            }
            if (!found.isEmpty()) {
                categories.add(new SkillCategoryDTO(catName, color, found));
            }
        }

        // If still nothing found, add Java as everyone knows something
        if (categories.isEmpty()) {
            categories.add(new SkillCategoryDTO("General", "indigo",
                    Arrays.asList("Problem Solving", "Communication", "Teamwork")));
        }

        // Use name/experience from AI if available, else extract from text
        String name = (aiProfile.getName() != null && !aiProfile.getName().isBlank())
                ? aiProfile.getName()
                : extractName(text);
        String exp = (aiProfile.getExperience() != null && !aiProfile.getExperience().isBlank())
                ? aiProfile.getExperience()
                : extractExperience(text);
        String edu = (aiProfile.getEducation() != null && !aiProfile.getEducation().isBlank())
                ? aiProfile.getEducation()
                : extractEducation(text);

        log.info("Regex extraction found " + categories.stream().mapToInt(c -> c.getSkills().size()).sum() + " skills");
        return new ResumeProfileDTO(name, exp, edu, categories);
    }

    private String extractName(String text) {
        // First non-empty line is usually the candidate name
        String[] lines = text.split("\\n");
        for (String line : lines) {
            String clean = line.trim();
            if (clean.length() > 3 && clean.length() < 60 && !clean.contains("@") && !clean.matches(".*\\d{4}.*")) {
                return clean;
            }
        }
        return "Candidate";
    }

    private String extractExperience(String text) {
        Matcher m = Pattern.compile("(\\d+)\\+?\\s*(?:years?|yrs?)\\s*(?:of)?\\s*(?:experience|exp)",
                Pattern.CASE_INSENSITIVE).matcher(text);
        return m.find() ? m.group(1) + " years" : "Fresher";
    }

    private String extractEducation(String text) {
        String lower = text.toLowerCase();
        if (lower.contains("ph.d") || lower.contains("phd"))
            return "Ph.D";
        if (lower.contains("m.tech") || lower.contains("m.s."))
            return "M.Tech / M.S.";
        if (lower.contains("mba"))
            return "MBA";
        if (lower.contains("m.sc") || lower.contains("msc"))
            return "M.Sc.";
        if (lower.contains("b.tech") || lower.contains("b.e."))
            return "B.Tech / B.E.";
        if (lower.contains("bsc") || lower.contains("b.sc"))
            return "B.Sc.";
        if (lower.contains("bachelor"))
            return "Bachelor's Degree";
        if (lower.contains("master"))
            return "Master's Degree";
        return "Degree";
    }

    private String properCase(String s) {
        // Handle known acronyms and brand names
        Map<String, String> known = new HashMap<>();
        known.put("css", "CSS");
        known.put("html", "HTML");
        known.put("sql", "SQL");
        known.put("aws", "AWS");
        known.put("gcp", "GCP");
        known.put("api", "API");
        known.put("oop", "OOP");
        known.put("ci/cd", "CI/CD");
        known.put("nlp", "NLP");
        known.put("node.js", "Node.js");
        known.put("react.js", "React.js");
        known.put("vue", "Vue.js");
        known.put("php", "PHP");
        known.put("asp.net", "ASP.NET");
        known.put("ui/ux", "UI/UX");
        known.put("rest api", "REST API");
        if (known.containsKey(s.toLowerCase()))
            return known.get(s.toLowerCase());
        String[] words = s.split("\\s+");
        return Arrays.stream(words)
                .map(w -> w.isEmpty() ? w : Character.toUpperCase(w.charAt(0)) + w.substring(1))
                .collect(Collectors.joining(" "));
    }

    private ResumeProfileDTO buildFallbackProfile(String rawText) {
        List<SkillCategoryDTO> cats = new ArrayList<>();
        cats.add(new SkillCategoryDTO("General", "indigo", Arrays.asList("Problem Solving", "Communication")));
        ResumeProfileDTO dto = new ResumeProfileDTO("Candidate", "Not specified", "Not specified", cats);
        dto.setGeneratedQuestions(List.of());
        return dto;
    }

    // ── File Text Extraction ───────────────────────────────────────────────────
    private String extractText(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename();
        if (filename != null && filename.toLowerCase().endsWith(".pdf")) {
            try (PDDocument doc = PDDocument.load(file.getInputStream())) {
                PDFTextStripper stripper = new PDFTextStripper();
                stripper.setSortByPosition(true);
                return stripper.getText(doc);
            }
        } else if (filename != null && (filename.toLowerCase().endsWith(".docx"))) {
            try (XWPFDocument doc = new XWPFDocument(file.getInputStream())) {
                return doc.getParagraphs().stream()
                        .map(XWPFParagraph::getText)
                        .filter(t -> t != null && !t.isBlank())
                        .collect(Collectors.joining("\n"));
            }
        } else {
            // Plain text fallback
            return new String(file.getBytes());
        }
    }
}
