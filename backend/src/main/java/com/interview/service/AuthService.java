package com.interview.service;

import com.interview.dto.AuthResponse;
import com.interview.dto.LoginRequest;
import com.interview.dto.RegisterRequest;
import com.interview.model.User;
import com.interview.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepo;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    public AuthResponse register(RegisterRequest req) {
        if (req.getEmail() == null || req.getEmail().isBlank())
            return new AuthResponse(false, "Email is required");
        if (req.getPassword() == null || req.getPassword().length() < 6)
            return new AuthResponse(false, "Password must be at least 6 characters");
        if (req.getFullName() == null || req.getFullName().isBlank())
            return new AuthResponse(false, "Full name is required");
        if (userRepo.existsByEmail(req.getEmail().toLowerCase()))
            return new AuthResponse(false, "An account with this email already exists");

        User user = new User(
                req.getEmail().toLowerCase().trim(),
                encoder.encode(req.getPassword()),
                req.getFullName().trim(),
                req.getPhone());
        user = userRepo.save(user);
        return new AuthResponse(true, "Account created successfully", user.getId(), user.getFullName(),
                user.getEmail());
    }

    public AuthResponse login(LoginRequest req) {
        if (req.getEmail() == null || req.getPassword() == null)
            return new AuthResponse(false, "Email and password are required");

        return userRepo.findByEmail(req.getEmail().toLowerCase().trim())
                .map(user -> {
                    if (encoder.matches(req.getPassword(), user.getPassword())) {
                        return new AuthResponse(true, "Login successful", user.getId(), user.getFullName(),
                                user.getEmail());
                    }
                    return new AuthResponse(false, "Incorrect password");
                })
                .orElse(new AuthResponse(false, "No account found with this email"));
    }
}
