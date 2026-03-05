import React, { createContext, useContext, useState, type ReactNode } from 'react';

export interface AuthUser {
    userId: string;
    fullName: string;
    email: string;
}

interface AuthContextType {
    user: AuthUser | null;
    login: (user: AuthUser) => void;
    logout: () => void;
    isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: () => { },
    logout: () => { },
    isLoggedIn: false,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(() => {
        try {
            const stored = localStorage.getItem('ai_interview_user');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const login = (userData: AuthUser) => {
        setUser(userData);
        localStorage.setItem('ai_interview_user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('ai_interview_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
