package com.interview.service;

import com.interview.dto.ResumeProfileDTO;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Service
public class ResumeService {

    private static final Logger log = Logger.getLogger(ResumeService.class.getName());

    private final AiService aiService;

    public ResumeService(AiService aiService) {
        this.aiService = aiService;
    }

    public ResumeProfileDTO parseAndExtract(MultipartFile file) throws IOException {
        String rawText = extractText(file);
        log.fine("Extracted " + rawText.length() + " characters from resume");
        return aiService.extractResumeProfile(rawText);
    }

    private String extractText(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename();
        if (filename != null && filename.toLowerCase().endsWith(".pdf")) {
            try (PDDocument doc = PDDocument.load(file.getInputStream())) {
                return new PDFTextStripper().getText(doc);
            }
        } else {
            try (XWPFDocument doc = new XWPFDocument(file.getInputStream())) {
                return doc.getParagraphs().stream()
                        .map(XWPFParagraph::getText)
                        .filter(t -> t != null && !t.isBlank())
                        .collect(Collectors.joining("\n"));
            }
        }
    }
}
