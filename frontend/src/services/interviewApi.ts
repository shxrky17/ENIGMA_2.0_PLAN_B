import api from './api';

// ── Types (matching backend DTOs) ─────────────────────────────────────────────
export interface SkillCategory {
    category: string;
    color: string;
    skills: string[];
}

export interface ResumeProfile {
    name: string;
    experience: string;
    education: string;
    skillCategories: SkillCategory[];
    generatedQuestions?: string[];
}

export interface PersonalizedQuestion {
    id: number;
    text: string;
    topic: string;
    skill: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    followUps: string[];
}

export interface StartInterviewResponse {
    sessionId: string;
    firstQuestion: PersonalizedQuestion;
    totalQuestions: number;
}

export interface CodeSubmitResponse {
    passed: boolean;
    timeComplexity: string;
    spaceComplexity: string;
    feedback: string;
    testResults: { input: string; expected: string; actual: string; status: string }[];
}

export interface ScoreItem { label: string; score: number; max: number; note: string; }
export interface ScoreBreakdown { score: number; breakdown: ScoreItem[]; }
export interface LogicalStep { phase: string; rating: number; detail: string; }
export interface FollowUpQuestion { question: string; difficulty: string; topic: string; }
export interface QuestionAsked { skill: string; question: string; difficulty: string; }
export interface InterviewContextEntry {
    question: string;
    answer: string;
    questionId?: number;
    questionIdx?: number;
    timestamp?: string;
}
export interface CodeSubmission {
    language: string;
    questionId?: number;
    questionText: string;
    code: string;
    passed: boolean;
    timeComplexity?: string;
    spaceComplexity?: string;
    feedback?: string;
    timestamp?: string;
}
export interface CodeApproachItem {
    title: string;
    summary: string;
    rating: number;
}

export interface ReportData {
    overall: number;
    role: string;
    date: string;
    duration: string;
    technical: ScoreBreakdown;
    communication: ScoreBreakdown;
    logicalAnalysis: { summary: string; steps: LogicalStep[] };
    followUpQuestions: FollowUpQuestion[];
    strengths: string[];
    improvements: string[];
    personalisation: { skills: string[]; questionsAsked: QuestionAsked[] };
    logicalReasoningScore?: number;
    problemSpeedScore?: number;
    interviewContext?: InterviewContextEntry[];
    codeSubmissions?: CodeSubmission[];
    codeApproach?: CodeApproachItem[];
}

export interface SessionSummary {
    sessionId: string;
    reportId: string | null;
    topic: string;
    difficulty: string;
    overallScore: number;
    technicalScore: number;
    communicationScore: number;
    status: string;
    date: string;
    duration: string;
    skills: string[];
}

// ── API Functions ─────────────────────────────────────────────────────────────

export const uploadResume = async (file: File): Promise<ResumeProfile> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post<ResumeProfile>('/resume/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

export const startInterview = async (payload: {
    skills: string[];
    difficulty: string;
    topic: string;
    candidateName?: string;
    candidateExperience?: string;
    candidateEducation?: string;
    generatedQuestions?: string[];
}): Promise<StartInterviewResponse> => {
    const { data } = await api.post<StartInterviewResponse>('/interview/start', payload);
    return data;
};

export const submitCode = async (
    sessionId: string,
    payload: { code: string; language: string; questionId: number }
): Promise<CodeSubmitResponse> => {
    const { data } = await api.post<CodeSubmitResponse>(`/interview/${sessionId}/submit-code`, payload);
    return data;
};

export const endInterview = async (sessionId: string): Promise<{ reportId: string }> => {
    const { data } = await api.post<{ reportId: string }>(`/interview/${sessionId}/end`);
    return data;
};

export const getInterviewQuestions = async (sessionId: string): Promise<PersonalizedQuestion[]> => {
    const { data } = await api.get<PersonalizedQuestion[]>(`/interview/${sessionId}/questions`);
    return data;
};

export const getReport = async (reportId: string): Promise<ReportData> => {
    const { data } = await api.get<ReportData>(`/report/${reportId}`);
    return data;
};

export const generateMoreFollowUps = async (reportId: string): Promise<FollowUpQuestion[]> => {
    const { data } = await api.post<FollowUpQuestion[]>(`/report/${reportId}/generate-more`);
    return data;
};

export const getDashboardHistory = async (): Promise<SessionSummary[]> => {
    const { data } = await api.get<SessionSummary[]>('/dashboard/history');
    return data;
};
