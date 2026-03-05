package com.interview.service;

import com.interview.dto.PersonalizedQuestionDTO;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class QuestionBankService {

        private static final Map<String, List<PersonalizedQuestionDTO>> BANK = new LinkedHashMap<>();

        static {
                BANK.put("React", List.of(
                                q(1, "You listed React on your resume. Can you explain the difference between controlled and uncontrolled components?",
                                                "Frontend", "React", "Medium",
                                                List.of("How do refs relate to uncontrolled components?",
                                                                "When would you prefer one over the other?")),
                                q(2, "Given your React experience, how would you optimise a component that re-renders too frequently?",
                                                "Performance", "React", "Hard",
                                                List.of("What is the difference between useMemo and useCallback?",
                                                                "When should you avoid memoization?"))));
                BANK.put("TypeScript", List.of(
                                q(3, "Your resume shows TypeScript — can you explain what a generic type is and give a practical example?",
                                                "Languages", "TypeScript", "Medium",
                                                List.of("How are generics different from the 'any' type?",
                                                                "Can you write a generic function that works on any array?"))));
                BANK.put("Spring Boot", List.of(
                                q(4, "You have Spring Boot on your resume. How does dependency injection work in Spring? Walk me through an example.",
                                                "Backend", "Spring Boot", "Medium",
                                                List.of("What is the difference between @Component, @Service, and @Repository?",
                                                                "What scope is a Spring bean by default?"))));
                BANK.put("Data Structures", List.of(
                                q(5, "Given an array of integers, return the two indices that sum to a given target. Walk me through your approach before coding.",
                                                "DSA", "Data Structures", "Medium",
                                                List.of("Can you optimise beyond O(N²)?",
                                                                "What is the time complexity of your HashMap approach?",
                                                                "What if no solution exists — how do you handle that?"))));
                BANK.put("Algorithms", List.of(
                                q(6, "Explain how QuickSort works and why it's preferred over BubbleSort in practice.",
                                                "DSA", "Algorithms", "Medium",
                                                List.of("What is the worst-case time complexity of QuickSort?",
                                                                "How does pivot selection affect performance?"))));
                BANK.put("Python", List.of(
                                q(7, "Your resume lists Python. What is the difference between a list and a generator in Python, and when would you use each?",
                                                "Languages", "Python", "Easy",
                                                List.of("How does lazy evaluation help with large datasets?",
                                                                "Can you write a generator function?"))));
                BANK.put("System Design", List.of(
                                q(8, "Walk me through how you would design a URL shortener like bit.ly.",
                                                "System Design", "System Design", "Hard",
                                                List.of("How would you handle 1 million requests per second?",
                                                                "Where would you use a cache?",
                                                                "What database would you choose and why?"))));
                BANK.put("Node.js", List.of(
                                q(9, "You listed Node.js — explain the event loop and how it handles async operations.",
                                                "Backend", "Node.js", "Medium",
                                                List.of("What is the difference between setTimeout and setImmediate?"))));
                BANK.put("Java", List.of(
                                q(10, "Given your Java experience, explain the difference between an interface and an abstract class.",
                                                "Languages", "Java", "Medium",
                                                List.of("When would you choose one over the other?",
                                                                "How did Java 8 change interfaces?"))));
                BANK.put("CSS", List.of(
                                q(11, "Can you explain the CSS box model and how box-sizing affects layout?",
                                                "Frontend", "CSS", "Easy",
                                                List.of("What is the difference between margin and padding?"))));
                BANK.put("JavaScript", List.of(
                                q(12, "Your resume lists JavaScript. Can you explain closures and give a real-world use case?",
                                                "Languages", "JavaScript", "Medium",
                                                List.of("How does the event loop handle closures?",
                                                                "What are common closure pitfalls?"))));
                BANK.put("SQL", List.of(
                                q(13, "Walk me through how you would optimize a slow SQL query. What would you look at first?",
                                                "Database", "SQL", "Medium",
                                                List.of("What is the difference between an index and a primary key?",
                                                                "How do JOINs affect performance?"))));
                BANK.put("Docker", List.of(
                                q(14, "You have Docker on your resume. Explain the difference between a Docker image and a container.",
                                                "DevOps", "Docker", "Easy",
                                                List.of("How do volumes work in Docker?",
                                                                "What is docker-compose used for?"))));
                BANK.put("MongoDB", List.of(
                                q(15, "Your resume mentions MongoDB. How does document-based storage differ from relational databases?",
                                                "Database", "MongoDB", "Medium",
                                                List.of("When would you choose MongoDB over MySQL?",
                                                                "How do you handle relationships in MongoDB?"))));
                BANK.put("C++", List.of(
                                q(16, "Given your C++ background, explain memory management and how you avoid memory leaks.",
                                                "Languages", "C++", "Hard",
                                                List.of("What is RAII?", "How do smart pointers help?"))));
                BANK.put("Machine Learning", List.of(
                                q(17, "You listed Machine Learning. Explain the difference between overfitting and underfitting.",
                                                "ML", "Machine Learning", "Medium",
                                                List.of("How do you detect overfitting?",
                                                                "What techniques do you use to prevent it?"))));
        }

        private static final List<PersonalizedQuestionDTO> DEFAULT_QUESTIONS = List.of(
                        q(99, "Tell me about yourself and your most challenging technical project.", "General",
                                        "General", "Easy",
                                        List.of("What technology choices would you change in hindsight?",
                                                        "What did you learn from that project?")),
                        q(100, "Given an array of integers, return the two indices that sum to a target value. What is your approach?",
                                        "DSA", "Data Structures", "Medium",
                                        List.of("Can you do it in O(N)?", "What data structure did you use?")));

        /**
         * Build a question queue from static bank for known skills.
         * Returns questions found for matching skills.
         */
        public List<PersonalizedQuestionDTO> buildQueueFromBank(List<String> skills) {
                List<PersonalizedQuestionDTO> queue = new ArrayList<>();
                Set<Integer> usedIds = new HashSet<>();
                for (String skill : skills) {
                        // Case-insensitive match
                        String matchKey = findKey(skill);
                        if (matchKey != null) {
                                List<PersonalizedQuestionDTO> qs = BANK.get(matchKey);
                                if (qs != null) {
                                        for (PersonalizedQuestionDTO q : qs) {
                                                if (!usedIds.contains(q.getId())) {
                                                        queue.add(q);
                                                        usedIds.add(q.getId());
                                                        break;
                                                }
                                        }
                                }
                        }
                }
                return queue;
        }

        /**
         * Build the full question queue, trying static bank first.
         * For any skill not in static bank, it requires AI generation (done via
         * AiService).
         * Falls back to DEFAULT_QUESTIONS if nothing found.
         */
        public List<PersonalizedQuestionDTO> buildQueue(List<String> skills) {
                List<PersonalizedQuestionDTO> queue = buildQueueFromBank(skills);
                if (queue.isEmpty()) {
                        return new ArrayList<>(DEFAULT_QUESTIONS);
                }
                return queue;
        }

        /**
         * Get skills that are NOT in the static bank (need AI generation).
         */
        public List<String> getUnknownSkills(List<String> skills) {
                List<String> unknown = new ArrayList<>();
                for (String skill : skills) {
                        if (findKey(skill) == null) {
                                unknown.add(skill);
                        }
                }
                return unknown;
        }

        public boolean hasSkillInBank(String skill) {
                return findKey(skill) != null;
        }

        public PersonalizedQuestionDTO getById(int id) {
                return BANK.values().stream().flatMap(List::stream)
                                .filter(q -> q.getId() == id).findFirst()
                                .orElseGet(() -> DEFAULT_QUESTIONS.get(0));
        }

        private String findKey(String skill) {
                for (String key : BANK.keySet()) {
                        if (key.equalsIgnoreCase(skill.trim()))
                                return key;
                }
                return null;
        }

        private static PersonalizedQuestionDTO q(int id, String text, String topic, String skill, String difficulty,
                        List<String> followUps) {
                return new PersonalizedQuestionDTO(id, text, topic, skill, difficulty, followUps);
        }
}
