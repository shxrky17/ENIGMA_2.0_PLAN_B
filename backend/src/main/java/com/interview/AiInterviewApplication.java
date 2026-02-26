package com.interview;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AiInterviewApplication {
    public static void main(String[] args) {
        SpringApplication.run(AiInterviewApplication.class, args);
        System.out.println("\n==========================================");
        System.out.println("  AI Interview Backend Started!");
        System.out.println("  API:      http://localhost:8080/api");
        System.out.println("  WebSocket: ws://localhost:8080/ws");
        System.out.println("  H2 Console: http://localhost:8080/h2-console");
        System.out.println("==========================================\n");
    }
}
