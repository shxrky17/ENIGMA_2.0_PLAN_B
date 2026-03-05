package com.interview.controller;

import com.interview.dto.AuthResponse;
import com.interview.dto.LoginRequest;
import com.interview.dto.RegisterRequest;
import com.interview.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest req) {
        AuthResponse r = authService.register(req);
        return r.isSuccess() ? ResponseEntity.ok(r) : ResponseEntity.badRequest().body(r);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest req) {
        AuthResponse r = authService.login(req);
        return r.isSuccess() ? ResponseEntity.ok(r) : ResponseEntity.status(401).body(r);
    }
}
