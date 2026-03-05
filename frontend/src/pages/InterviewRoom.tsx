import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    Mic, MicOff, CheckCircle, StopCircle, Radio,
    AlertTriangle, Sparkles, ChevronRight, Volume2, VolumeX
} from 'lucide-react';
import { Brain, Wifi } from 'lucide-react';
import { useWebSpeech } from '../hooks/interviewHooks';
import { endInterview, getInterviewQuestions, submitCode } from '../services/interviewApi';
import type { PersonalizedQuestion } from '../services/interviewApi';
import api from '../services/api';
import { CodeEditor } from '../components/interview/CodeEditor';
import type { JudgeResult } from '../components/interview/CodeEditor';

type Message = { sender: 'ai' | 'user' | 'system'; text: string };
type EditorTestCase = { input: string; expectedOutput: string };
type PracticeMode = 'none' | 'array' | 'string';
type AiEvent = {
    type: 'AI_QUESTION' | 'COMPLETED' | 'AI_FOLLOWUP' | string;
    text: string;
    question?: PersonalizedQuestion;
    questionIdx: number;
    totalQuestions: number;
};

function getTestCasesForQuestion(question: PersonalizedQuestion | null): EditorTestCase[] {
    if (!question) {
        return [
            { input: "2 3", expectedOutput: "5" },
            { input: "10 -5", expectedOutput: "5" },
            { input: "0 0", expectedOutput: "0" },
        ];
    }

    const text = `${question.text} ${question.topic} ${question.skill}`.toLowerCase();

    if (text.includes('two sum') || text.includes('sum to a given target')) {
        return [
            { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" },
            { input: "[3,2,4]\n6", expectedOutput: "[1,2]" },
            { input: "[3,3]\n6", expectedOutput: "[0,1]" },
        ];
    }

    if (text.includes('reverse') && text.includes('string')) {
        return [
            { input: "hello", expectedOutput: "olleh" },
            { input: "interview", expectedOutput: "weivretni" },
            { input: "", expectedOutput: "" },
        ];
    }

    if (text.includes('palindrome')) {
        return [
            { input: "racecar", expectedOutput: "true" },
            { input: "code", expectedOutput: "false" },
            { input: "a", expectedOutput: "true" },
        ];
    }

    return [
        { input: "2 3", expectedOutput: "5" },
        { input: "10 -5", expectedOutput: "5" },
        { input: "-3 -9", expectedOutput: "-12" },
    ];
}

// ── Text-to-Speech Hook ────────────────────────────────────────────────────────
function useTTS() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [enabled, setEnabled] = useState(true);

    const getBestVoice = (): SpeechSynthesisVoice | null => {
        const voices = window.speechSynthesis.getVoices();
        const preferred = [
            'Google US English', 'Microsoft David', 'Microsoft Zira',
            'Samantha', 'Alex', 'Google UK English Female',
        ];
        for (const name of preferred) {
            const v = voices.find(v => v.name.includes(name));
            if (v) return v;
        }
        return voices.find(v => v.lang.startsWith('en')) || null;
    };

    const speak = useCallback((text: string) => {
        if (!enabled || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const clean = text.replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, ' ').trim().substring(0, 600);
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.rate = 0.92;
        utterance.pitch = 1.05;
        utterance.volume = 1.0;
        const voice = getBestVoice();
        if (voice) utterance.voice = voice;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        setTimeout(() => window.speechSynthesis.speak(utterance), 100);
    }, [enabled]);

    const stop = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, []);

    return { speak, stop, isSpeaking, enabled, setEnabled };
}

// ── Sound Wave component ───────────────────────────────────────────────────────
const SpeakingWave: React.FC = () => (
    <div className="flex items-center gap-[3px]">
        {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-[3px] bg-indigo-400 rounded-full"
                style={{ height: '10px', animation: `soundwave 0.6s ease-in-out ${i * 0.12}s infinite alternate` }} />
        ))}
    </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const InterviewRoom: React.FC = () => {
    const navigate = useNavigate();
    const { id: sessionId } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();

    const skillsParam = searchParams.get('skills') || '';
    const skills = skillsParam ? skillsParam.split(',').filter(Boolean) : ['General'];
    const totalFromParam = parseInt(searchParams.get('total') || '0', 10);
    const firstQText = searchParams.get('q') || `Tell me about your experience with ${skills[0] || 'software development'}.`;
    const firstQSkill = searchParams.get('qSkill') || skills[0] || 'General';
    const firstQDiff = (searchParams.get('qDiff') || 'Medium') as 'Easy' | 'Medium' | 'Hard';
    const firstQTopic = searchParams.get('qTopic') || 'General';
    const candidateName = searchParams.get('candidate') || 'Candidate';
    const roleName = searchParams.get('role') || 'Software Engineer';

    const {
        isSupported: isSpeechSupported,
        isListening,
        interimTranscript,
        finalTranscript,
        error: speechError,
        toggleListening,
        resetTranscript
    } = useWebSpeech();
    const { speak, stop, isSpeaking, enabled: ttsEnabled, setEnabled: setTtsEnabled } = useTTS();

    const [isConnected, setIsConnected] = useState(false);
    const [aiStatus, setAiStatus] = useState<'Listening' | 'Speaking' | 'Thinking'>('Thinking');
    const [messages, setMessages] = useState<Message[]>([]);
    const [, setQuestionQueue] = useState<PersonalizedQuestion[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<PersonalizedQuestion | null>(null);
    const [questionIdx, setQuestionIdx] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(totalFromParam || skills.length);
    const [isInterviewComplete, setIsInterviewComplete] = useState(false);
    const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [isEndingInterview, setIsEndingInterview] = useState(false);

    const [code, setCode] = useState('// Write your solution here...\n\n');
    const [language] = useState('java');
    const [practiceMode, setPracticeMode] = useState<PracticeMode>('none');
    const [timer, setTimer] = useState(2700);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [warnings, setWarnings] = useState(0);
    const [isLockedOut, setIsLockedOut] = useState(false);

    const isCodingQuestion = practiceMode !== 'none';

    const practiceQuestionText = useMemo(() => {
        if (practiceMode === 'array') {
            return 'Array Practice: Given an integer array and target, return indices of two numbers that add up to target (Two Sum).';
        }
        if (practiceMode === 'string') {
            return 'String Practice: Given a string, return the reversed string.';
        }
        return '';
    }, [practiceMode]);

    const currentTestCases = useMemo(
        () => {
            if (practiceMode === 'array') {
                return [
                    { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" },
                    { input: "[3,2,4]\n6", expectedOutput: "[1,2]" },
                    { input: "[3,3]\n6", expectedOutput: "[0,1]" },
                ];
            }
            if (practiceMode === 'string') {
                return [
                    { input: "hello", expectedOutput: "olleh" },
                    { input: "interview", expectedOutput: "weivretni" },
                    { input: "abc", expectedOutput: "cba" },
                ];
            }
            return getTestCasesForQuestion(currentQuestion);
        },
        [currentQuestion, practiceMode]
    );

    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const lastSubmittedAnswerRef = useRef('');

    useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, interimTranscript]);

    // ── Add message + auto-speak AI messages ──────────────────────────────────
    const addMsg = useCallback((sender: 'ai' | 'user' | 'system', text: string) => {
        setMessages(prev => [...prev, { sender, text }]);
        if (sender === 'ai' && text) {
            speak(text);
            setAiStatus('Speaking');
            const ms = Math.max(2500, text.length * 55);
            setTimeout(() => setAiStatus('Listening'), ms);
        }
    }, [speak]);

    // ── WebSocket setup ───────────────────────────────────────────────────────
    // ─────────────────────────────────────────────────────────────
// Send user's speech to backend (FIXED MULTI-QUESTION FLOW)
// ─────────────────────────────────────────────────────────────
useEffect(() => {
    if (!sessionId) return;
    if (!finalTranscript.trim()) return;
    if (isSubmittingAnswer) return;

    const answer = finalTranscript.trim();

    // Prevent very short noise triggers
    if (answer.length < 3) {
        resetTranscript();
        return;
    }

    // Show user message
    addMsg('user', answer);
    setAiStatus('Thinking');
    setIsSubmittingAnswer(true);

    const handleAnswer = async () => {
        try {
            const payload = {
                questionText: currentQuestion?.text || 'General question',
                transcript: answer,
                questionId: currentQuestion?.id ?? 0,
                questionIdx,
            };

            const { data } = await api.post<AiEvent>(
                `/interview/${sessionId}/answer`,
                payload
            );

            console.log("AI RESPONSE:", data);

            if (typeof data?.totalQuestions === 'number') {
                setTotalQuestions(data.totalQuestions);
            }

            // Interview completed
            if (data?.type === 'COMPLETED') {
                if (data?.text) {
                    setTimeout(() => addMsg('ai', data.text), 200);
                }
                setIsInterviewComplete(true);
                return;
            }

            // New question received
            if (data?.question) {

                // IMPORTANT: Update state BEFORE speaking
                setCurrentQuestion(data.question);

                setQuestionIdx(
                    typeof data.questionIdx === 'number'
                        ? data.questionIdx
                        : questionIdx + 1
                );

                // Slight delay to ensure React updates state
                setTimeout(() => {
                    addMsg('ai', data.question!.text);
                }, 250);

            } else if (data?.text) {
                setTimeout(() => addMsg('ai', data.text), 200);
            }

        } catch (error) {
            console.error("Submit error:", error);
            addMsg('system', 'Could not submit your answer. Please try again.');
        } finally {
            setIsSubmittingAnswer(false);
            resetTranscript();
        }
    };

    handleAnswer();

}, [
    finalTranscript,
    sessionId,
    isSubmittingAnswer,
    currentQuestion,
    questionIdx
]);

    // ── Send user's speech to backend ─────────────────────────────────────────
    useEffect(() => {
        if (!sessionId || !finalTranscript.trim() || isSubmittingAnswer) return;
        const answer = finalTranscript.trim();
        if (answer === lastSubmittedAnswerRef.current) {
            resetTranscript();
            return;
        }
        lastSubmittedAnswerRef.current = answer;
        addMsg('user', answer);
        setAiStatus('Thinking');
        resetTranscript();

        const handleAnswer = async () => {
            const questionText = currentQuestion?.text || 'General question';
            setIsSubmittingAnswer(true);
            try {
                const payload = {
                    questionText,
                    transcript: answer,
                    questionId: currentQuestion?.id ?? 0,
                    questionIdx,
                };
                const { data } = await api.post<AiEvent>(`/interview/${sessionId}/answer`, payload);
                if (typeof data?.totalQuestions === 'number' && data.totalQuestions > 0) {
                    setTotalQuestions(data.totalQuestions);
                }

                if (data?.type === 'COMPLETED') {
                    if (data?.text) {
                        addMsg('ai', data.text);
                    }
                    setIsInterviewComplete(true);
                } else if (data?.question) {
                    addMsg('ai', data.question.text);
                    setCurrentQuestion(data.question);
                    setQuestionIdx(typeof data.questionIdx === 'number' ? data.questionIdx : questionIdx + 1);
                } else if (data?.text) {
                    addMsg('ai', data.text);
                }
            } catch {
                addMsg('system', 'Could not submit your answer to server. Please try again.');
            } finally {
                setIsSubmittingAnswer(false);
            }
        };

        handleAnswer();
    }, [finalTranscript, sessionId, isSubmittingAnswer]); // eslint-disable-line

    // Stop TTS when user starts speaking
    useEffect(() => { if (isListening) stop(); }, [isListening]); // eslint-disable-line

    // Timer
    useEffect(() => {
        const interval = setInterval(() => setTimer(t => t > 0 ? t - 1 : 0), 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (s: number) =>
        `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    // Proctoring
    const handleFSChange = useCallback(() => {
        if (!document.fullscreenElement) {
            setIsFullscreen(false);
            setWarnings(w => { const n = w + 1; if (n >= 3) setIsLockedOut(true); return n; });
        } else setIsFullscreen(true);
    }, []);

    useEffect(() => {
        const noCtx = (e: MouseEvent) => e.preventDefault();
        const onVis = () => {
            if (document.hidden)
                setWarnings(w => { const n = w + 1; if (n >= 3) setIsLockedOut(true); return n; });
        };
        document.addEventListener('fullscreenchange', handleFSChange);
        document.addEventListener('visibilitychange', onVis);
        document.addEventListener('contextmenu', noCtx);
        return () => {
            document.removeEventListener('fullscreenchange', handleFSChange);
            document.removeEventListener('visibilitychange', onVis);
            document.removeEventListener('contextmenu', noCtx);
        };
    }, [handleFSChange]);

    // ── End interview (called after user confirms) ────────────────────────────
    const doEndInterview = async () => {
        setIsEndingInterview(true);
        stop();
        try {
            const { reportId } = await endInterview(sessionId!);
            navigate(`/report/${reportId}`);
        } catch {
            navigate(`/report/${sessionId}`);
        }
    };

    // Guard: show confirmation if interview is not yet complete
    const requestEnd = () => {
        if (isInterviewComplete) { doEndInterview(); return; }
        setShowEndConfirm(true);
    };

    const handleSubmitCode = async (submittedCode?: string, judgeResult?: JudgeResult) => {
        if (!sessionId) return;
        
        try {
            const finalCode = submittedCode || code;

            // Format feedback from JudgeResult if available
            let feedbackStr = 'Submitted for review.';
            if (judgeResult) {
                feedbackStr = judgeResult.passed
                    ? `Passed all ${judgeResult.totalCount} test cases!`
                    : `Failed ${judgeResult.totalCount - judgeResult.passedCount} out of ${judgeResult.totalCount} cases.`;
            }

            addMsg('system', `Code submitted. ${feedbackStr}`);

            // If you actually have a backend submit endpoint
            const result = await submitCode(sessionId, {
                code: finalCode, language, questionId: currentQuestion?.id ?? 0,
            });
            console.log("Evaluation Result:", result);
        } catch {
            console.log("Solution Submitted to AI");
        }
    };

    const enterFS = () => document.documentElement.requestFullscreen().catch(console.error);

    const openPracticeEditor = (mode: PracticeMode) => {
        setPracticeMode(mode);
        if (mode === 'array') {
            setCode(
                `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Implement your array solution here\n    }\n}`
            );
        } else if (mode === 'string') {
            setCode(
                `public class Main {\n    public static void main(String[] args) {\n        // Implement your string solution here\n    }\n}`
            );
        }
    };

    // ── Guard screens ─────────────────────────────────────────────────────────
    if (isLockedOut) return (
        <div className="fixed inset-0 bg-gray-950/95 backdrop-blur-xl z-[9999] flex items-center justify-center">
            <div className="max-w-md text-center p-12 border border-red-500/40 rounded-2xl bg-gray-900">
                <AlertTriangle size={64} className="text-red-500 mx-auto mb-6" />
                <h2 className="text-3xl font-bold mb-4">Interview Terminated</h2>
                <p className="text-gray-300 mb-8">Exceeded maximum proctoring violations.</p>
                <button className="px-6 py-3 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors"
                    onClick={() => navigate('/dashboard')}>Return to Dashboard</button>
            </div>
        </div>
    );

    if (!isFullscreen) return (
        <div className="fixed inset-0 bg-gray-950/95 backdrop-blur-xl z-[9999] flex items-center justify-center">
            <div className="max-w-md text-center p-12 border border-gray-800 rounded-2xl bg-gray-900">
                <AlertTriangle size={48} className="text-amber-500 mx-auto mb-6" />
                <h2 className="text-3xl font-bold mb-4">Action Required</h2>
                <p className="text-gray-300 mb-6">This is a proctored session. You must stay fullscreen.</p>
                <p className="inline-block px-4 py-2 border border-amber-500/30 bg-amber-500/10 text-amber-500 rounded-lg mb-8">
                    Warnings remaining: <strong>{3 - warnings}</strong>
                </p>
                <button className="w-full primary-btn py-3 font-semibold text-lg" onClick={enterFS}>
                    Enter Fullscreen
                </button>
            </div>
        </div>
    );

    // ── Interview Complete Overlay (shown ONLY when all questions done) ────────
    if (isInterviewComplete) return (
        <div className="fixed inset-0 bg-gray-950 z-[9999] flex items-center justify-center">
            <div className="max-w-lg w-full text-center px-8 py-12 border border-indigo-500/30 rounded-3xl bg-gray-900 shadow-2xl shadow-indigo-500/10 mx-4">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/40">
                    <CheckCircle size={56} className="text-white" />
                </div>
                <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Interview Complete!
                </h2>
                <p className="text-gray-400 mb-3 text-lg">You answered all {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}.</p>
                <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">
                    Your <span className="text-indigo-400 font-medium">Technical Score</span> and{' '}
                    <span className="text-purple-400 font-medium">Communication Score</span> are being
                    calculated by Gemini AI from your interview transcript.
                </p>
                <button onClick={doEndInterview} disabled={isEndingInterview}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 text-white font-bold text-lg transition-all shadow-lg shadow-indigo-500/30">
                    {isEndingInterview ? 'Generating report…' : 'View Full Report →'}
                </button>
                <p className="text-xs text-gray-600 mt-4">
                    Scores are calculated strictly from your interview answers
                </p>
            </div>
        </div>
    );

    // ── Main Interview UI ─────────────────────────────────────────────────────
    return (
        <div className="h-screen w-full flex flex-col bg-gray-950 text-gray-100 overflow-hidden font-sans">

            {/* Confirmation Dialog */}
            {showEndConfirm && (
                <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="max-w-sm w-full mx-4 p-8 border border-red-500/30 rounded-2xl bg-gray-900 shadow-2xl text-center">
                        <AlertTriangle size={40} className="text-amber-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">End Interview Early?</h3>
                        <p className="text-gray-400 text-sm mb-6">
                            You still have questions remaining.<br />
                            Your report will only use answers given so far.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowEndConfirm(false)}
                                className="flex-1 py-2.5 rounded-xl border border-gray-700 hover:bg-gray-800 text-sm font-medium transition-colors">
                                Continue Interview
                            </button>
                            <button onClick={() => { setShowEndConfirm(false); doEndInterview(); }}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors">
                                End & Get Report
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Bar */}
            <header className="h-14 flex items-center justify-between px-6 bg-gray-900 border-b border-gray-800 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        {isConnected
                            ? <Wifi size={16} className="text-emerald-500 animate-pulse" />
                            : <Wifi size={16} className="text-red-500" />}
                        <span className="text-sm text-gray-400">{isConnected ? 'Live' : 'Connecting...'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400">
                        <Sparkles size={11} /> Personalised to your resume
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/[0.08] text-xs text-gray-400">
                        Q {questionIdx + 1}/{totalQuestions}
                    </div>
                    <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 max-w-[180px]">
                        <span className="text-cyan-200/80">Candidate:</span>
                        <span className="truncate font-medium">{candidateName}</span>
                    </div>
                    <div className="flex items-center gap-2 pl-2 border-l border-gray-800">
                        <button
                            onClick={() => openPracticeEditor('string')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                practiceMode === 'string'
                                    ? 'bg-indigo-500/20 border-indigo-400/50 text-indigo-200 shadow-[0_0_16px_rgba(99,102,241,0.25)]'
                                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            String
                        </button>
                        <button
                            onClick={() => openPracticeEditor('array')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                practiceMode === 'array'
                                    ? 'bg-purple-500/20 border-purple-400/50 text-purple-200 shadow-[0_0_16px_rgba(168,85,247,0.25)]'
                                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            Array
                        </button>
                        {practiceMode !== 'none' && (
                            <button
                                onClick={() => setPracticeMode('none')}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-all"
                            >
                                Close
                            </button>
                        )}
                    </div>
                </div>

                <div className="font-mono text-xl tracking-wider text-gray-300 font-bold">{formatTime(timer)}</div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setTtsEnabled(prev => { if (isSpeaking) stop(); return !prev; })}
                        title={ttsEnabled ? 'Mute AI voice' : 'Unmute AI voice'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${ttsEnabled
                            ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25'
                            : 'bg-gray-800 border-gray-700 text-gray-500 hover:bg-gray-700'
                            }`}>
                        {ttsEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                        <span className="hidden sm:inline">{ttsEnabled ? 'Voice On' : 'Voice Off'}</span>
                    </button>
                    <button onClick={requestEnd}
                        className="flex items-center gap-2 px-4 py-1.5 rounded bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors text-sm font-medium">
                        <StopCircle size={16} /> End Interview
                    </button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">

                {/* LEFT: AI Avatar Panel */}
                <section className="w-[300px] border-r border-gray-800 bg-gray-900/50 flex flex-col p-6 items-center shrink-0">
                    <h2 className="text-lg font-bold text-gray-200 mb-6">AI Interviewer</h2>

                    <div className="relative w-32 h-32 flex items-center justify-center mb-3">
                        {isSpeaking && <>
                            <div className="absolute inset-0 rounded-full border border-indigo-500/40 animate-ping opacity-70" />
                            <div className="absolute inset-2 rounded-full border border-purple-500/50 animate-[ping_1.5s_ease-out_infinite]"
                                style={{ animationDelay: '0.3s' }} />
                            <div className="absolute inset-4 rounded-full border border-indigo-400/30 animate-[ping_2s_ease-out_infinite]"
                                style={{ animationDelay: '0.6s' }} />
                        </>}
                        <div className={`relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg transition-all duration-500 ${isSpeaking ? 'shadow-[0_0_40px_rgba(99,102,241,0.7)] scale-110' : ''
                            }`}>
                            <Brain size={40} className="text-white opacity-80" />
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 h-9 mb-2">
                        {isSpeaking
                            ? <span className="text-indigo-400 text-sm font-medium flex items-center gap-2"><Radio className="animate-pulse" size={14} /> Speaking <SpeakingWave /></span>
                            : aiStatus === 'Listening'
                                ? <span className="text-emerald-400 text-sm font-medium flex items-center gap-1"><Mic size={14} /> Listening</span>
                                : <span className="text-purple-400 text-sm font-medium">
                                    Thinking
                                    <span className="animate-bounce">.</span>
                                    <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                                    <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                                </span>
                        }
                    </div>

                    {ttsEnabled && (
                        <div className="flex items-center gap-1.5 text-xs text-indigo-400/60 mb-2">
                            <Volume2 size={11} /> AI voice enabled
                        </div>
                    )}

                    {currentQuestion && (
                        <div className="w-full mb-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
                            <Sparkles size={11} className="shrink-0" />
                            <span className="truncate">Tailored for <strong>{currentQuestion.skill}</strong></span>
                        </div>
                    )}

                    <div className="w-full bg-gray-800/50 rounded-xl p-4 border border-gray-700 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs uppercase text-gray-400 font-bold tracking-wider">Current Question</h3>
                            {currentQuestion && (
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${currentQuestion.difficulty === 'Easy' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                                    currentQuestion.difficulty === 'Medium' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                                        'bg-red-500/15 text-red-400 border-red-500/30'
                                    }`}>{currentQuestion.difficulty}</span>
                            )}
                        </div>
                        <p className="text-sm text-gray-200 leading-relaxed flex-1 overflow-y-auto pr-1">
                            {currentQuestion?.text ?? 'Preparing your question...'}
                        </p>
                        {currentQuestion?.topic && (
                            <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-600">
                                <ChevronRight size={10} /> {currentQuestion.topic}
                            </div>
                        )}
                    </div>
                </section>

                {/* CENTER: Code Editor (Only for DSA/Coding) */}
                {isCodingQuestion ? (
                    <section className="flex-1 flex flex-col min-w-0 border-r border-gray-800">
                        <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/70">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-gray-500">Practice Problem</p>
                                    <p className="text-sm text-gray-200">{practiceQuestionText}</p>
                                </div>
                                <button
                                    onClick={() => setPracticeMode('none')}
                                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
                                >
                                    Close Editor
                                </button>
                            </div>
                        </div>
                        <CodeEditor
                            initialCode={code}
                            language={language}
                            questionText={practiceQuestionText || currentQuestion?.text || 'Solve the problem.'}
                            testCases={currentTestCases}
                            onSubmit={(c, res) => {
                                setCode(c);
                                handleSubmitCode(c, res);
                            }}
                            onOptimize={(optimized, explanation) => {
                                addMsg('ai', `Optimization Hint: ${explanation}`);
                                setCode(optimized);
                            }}
                        />
                    </section>
                ) : (
                    <section className="flex-1 flex items-center justify-center bg-gray-950 p-8 border-r border-gray-800">
                        <div className="text-center max-w-lg">
                            <Brain size={64} className="text-indigo-500/20 mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-gray-300 mb-3">Conceptual Question</h3>
                            <p className="text-gray-500">
                                This question does not require coding. Please speak your answer clearly.
                                Use the <span className="text-indigo-300 font-medium">String</span> or <span className="text-purple-300 font-medium">Array</span> buttons in the top bar to open a coding workspace.
                            </p>
                        </div>
                    </section>
                )}

                {/* RIGHT: Live Transcript */}
                <section className="w-[360px] border-l border-gray-800 bg-gray-900 flex flex-col shrink-0">
                    <div className="h-12 border-b border-gray-800 flex items-center px-4 shrink-0 gap-3">
                        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Live Transcript</h2>
                        {isSpeaking && (
                            <div className="flex items-center gap-2 text-xs text-indigo-400">
                                <SpeakingWave /><span>AI speaking…</span>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`max-w-[88%] rounded-xl p-3 text-sm leading-relaxed ${msg.sender === 'ai'
                                ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-100 self-start rounded-tl-sm'
                                : msg.sender === 'user'
                                    ? 'bg-gray-800 border border-gray-700 text-gray-200 self-end rounded-tr-sm'
                                    : 'bg-emerald-500/10 text-emerald-400 text-xs self-center border border-emerald-500/20 px-4 py-1 rounded-full'
                                }`}>
                                {msg.text}
                            </div>
                        ))}
                        {interimTranscript && (
                            <div className="max-w-[88%] rounded-xl p-3 text-sm bg-gray-800/50 border border-gray-700 border-dashed text-gray-400 self-end italic">
                                {interimTranscript}...
                            </div>
                        )}
                        <div ref={transcriptEndRef} />
                    </div>

                    <div className="p-4 border-t border-gray-800">
                        <div className="flex items-center bg-gray-800 rounded-full p-1 pr-4 border border-gray-700">
                            <button onClick={toggleListening}
                                disabled={!isSpeechSupported}
                                className={`w-12 h-12 rounded-full flex shrink-0 items-center justify-center transition-all ${isListening
                                    ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse'
                                    : isSpeechSupported ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-800 cursor-not-allowed'
                                    }`}>
                                {isListening ? <Mic size={22} className="text-white" /> : <MicOff size={22} className="text-gray-300" />}
                            </button>
                            <div className="flex-1 flex items-center justify-center gap-1 mx-3 h-8">
                                {isListening
                                    ? [1, 2, 3, 4, 5, 6, 7].map(i => (
                                        <div key={i} className="w-1.5 bg-red-400 rounded-full"
                                            style={{ height: '60%', animation: `waveform 0.8s ease-in-out ${i * 0.1}s infinite alternate` }} />
                                    ))
                                    : <span className="text-xs text-gray-500">
                                        {isSpeechSupported ? 'Click mic to speak' : 'Speech recognition not supported in this browser'}
                                    </span>
                                }
                            </div>
                        </div>
                        <p className="text-center text-xs text-gray-700 mt-2">
                            {ttsEnabled ? '🔊 AI speaks questions aloud' : '🔇 AI voice muted'}
                        </p>
                        {speechError && (
                            <p className="text-center text-xs text-red-400 mt-1">
                                Mic error: {speechError}
                            </p>
                        )}
                    </div>
                </section>
            </main>

            <style>{`
                @keyframes waveform  { 0% { transform: scaleY(0.3); } 100% { transform: scaleY(1.3); } }
                @keyframes soundwave { 0% { transform: scaleY(0.4); } 100% { transform: scaleY(1.6); } }
            `}</style>
        </div>
    );
};

export default InterviewRoom;


