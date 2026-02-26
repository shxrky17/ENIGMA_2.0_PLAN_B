import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Mic, MicOff, Play, CheckCircle, StopCircle, Radio, AlertTriangle, Sparkles, ChevronRight } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { Brain, Wifi } from 'lucide-react';
import { useWebSpeech } from '../hooks/interviewHooks';
import { wsService } from '../services/websocketService';
import type { WsAiEvent } from '../services/websocketService';
import { endInterview, submitCode } from '../services/interviewApi';
import type { PersonalizedQuestion } from '../services/interviewApi';

type Message = { sender: 'ai' | 'user' | 'system'; text: string };

const InterviewRoom: React.FC = () => {
    const navigate = useNavigate();
    const { id: sessionId } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();

    const skillsParam = searchParams.get('skills') || '';
    const skills = skillsParam ? skillsParam.split(',').filter(Boolean) : ['React', 'TypeScript', 'Data Structures'];
    const totalFromParam = parseInt(searchParams.get('total') || '0', 10);

    const { isListening, interimTranscript, finalTranscript, toggleListening, resetTranscript } = useWebSpeech();

    const [isConnected, setIsConnected] = useState(false);
    const [aiStatus, setAiStatus] = useState<'Listening' | 'Speaking' | 'Thinking'>('Thinking');
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<PersonalizedQuestion | null>(null);
    const [questionIdx, setQuestionIdx] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(totalFromParam || skills.length);
    const [isInterviewComplete, setIsInterviewComplete] = useState(false);

    const [code, setCode] = useState('// Write your solution here...\n\n');
    const [language, setLanguage] = useState('javascript');
    const [timer, setTimer] = useState(2700);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [warnings, setWarnings] = useState(0);
    const [isLockedOut, setIsLockedOut] = useState(false);
    const [submitResult, setSubmitResult] = useState<string | null>(null);

    const transcriptEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll transcript
    useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, interimTranscript]);

    // Connect to WebSocket
    useEffect(() => {
        if (!sessionId) return;

        const addMsg = (sender: 'ai' | 'user' | 'system', text: string) => {
            setMessages(prev => [...prev, { sender, text }]);
        };

        wsService.connect(
            sessionId,
            (event: WsAiEvent) => {
                setAiStatus('Speaking');
                if (event.type === 'AI_QUESTION' && event.question) {
                    setCurrentQuestion(event.question);
                    setQuestionIdx(event.questionIdx);
                    setTotalQuestions(event.totalQuestions);
                    addMsg('ai', event.question.text);
                } else if (event.type === 'AI_FOLLOWUP' || event.type === 'AI_FEEDBACK') {
                    addMsg('ai', event.text || '');
                } else if (event.type === 'COMPLETED') {
                    setIsInterviewComplete(true);
                    addMsg('ai', event.text || 'Interview complete! Click End Interview to see your report.');
                }
                setTimeout(() => setAiStatus('Listening'), 3000);
            },
            () => {
                // onConnect: ask backend for first question by sending empty answer
                setIsConnected(true);
                addMsg('system', 'Connected — interview starting...');
                setAiStatus('Thinking');
                // First question is delivered via the StartInterviewResponse (from ResumeSetup)
                // We also push it from URL for completeness
                setTimeout(() => {
                    const firstQText = searchParams.get('q') || `Tell me about your experience with ${skills[0] || 'software development'}.`;
                    setCurrentQuestion({
                        id: 0, text: firstQText, topic: 'General',
                        skill: skills[0] || 'General', difficulty: 'Medium', followUps: [],
                    });
                    setAiStatus('Speaking');
                    addMsg('ai', firstQText);
                    setTimeout(() => setAiStatus('Listening'), 3000);
                }, 1000);
            },
            () => { setIsConnected(false); }
        );

        return () => wsService.disconnect();
    }, [sessionId]);

    // Send transcript when user finishes speaking
    useEffect(() => {
        if (!finalTranscript.trim()) return;
        setMessages(prev => [...prev, { sender: 'user', text: finalTranscript }]);
        setAiStatus('Thinking');

        wsService.sendAnswer({
            questionText: currentQuestion?.text || '',
            transcript: finalTranscript,
            questionId: currentQuestion?.id || 0,
            questionIdx,
        });

        resetTranscript();
    }, [finalTranscript]);

    // Timer countdown
    useEffect(() => {
        const interval = setInterval(() => setTimer(t => t > 0 ? t - 1 : 0), 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    // Proctoring
    const handleFSChange = useCallback(() => {
        if (!document.fullscreenElement) {
            setIsFullscreen(false);
            setWarnings(w => { const n = w + 1; if (n >= 3) setIsLockedOut(true); return n; });
        } else setIsFullscreen(true);
    }, []);

    useEffect(() => {
        const noCtx = (e: MouseEvent) => e.preventDefault();
        const onVisibility = () => { if (document.hidden) setWarnings(w => { const n = w + 1; if (n >= 3) setIsLockedOut(true); return n; }); };
        document.addEventListener('fullscreenchange', handleFSChange);
        document.addEventListener('visibilitychange', onVisibility);
        document.addEventListener('contextmenu', noCtx);
        return () => {
            document.removeEventListener('fullscreenchange', handleFSChange);
            document.removeEventListener('visibilitychange', onVisibility);
            document.removeEventListener('contextmenu', noCtx);
        };
    }, [handleFSChange]);

    const handleSubmitCode = async () => {
        if (!sessionId) return;
        setSubmitResult('Evaluating...');
        try {
            const result = await submitCode(sessionId, { code, language, questionId: currentQuestion?.id || 0 });
            setSubmitResult(result.passed ? `✓ Passed · ${result.timeComplexity}` : `✗ Failed · ${result.feedback}`);
        } catch {
            setSubmitResult('✓ Submitted');
        }
        setTimeout(() => setSubmitResult(null), 4000);
    };

    const handleEndInterview = async () => {
        wsService.disconnect();
        try {
            const { reportId } = await endInterview(sessionId!);
            navigate(`/report/${reportId}`);
        } catch {
            navigate(`/report/${sessionId}`);
        }
    };

    const enterFS = () => document.documentElement.requestFullscreen().catch(console.error);

    if (isLockedOut) return (
        <div className="fixed inset-0 bg-gray-950/95 backdrop-blur-xl z-[9999] flex items-center justify-center">
            <div className="max-w-md text-center p-12 border border-red-500/40 rounded-2xl bg-gray-900">
                <AlertTriangle size={64} className="text-red-500 mx-auto mb-6" />
                <h2 className="text-3xl font-bold mb-4">Interview Terminated</h2>
                <p className="text-gray-300 mb-8">Exceeded maximum proctoring violations.</p>
                <button className="px-6 py-3 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors" onClick={() => navigate('/dashboard')}>Return to Dashboard</button>
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
                <button className="w-full primary-btn py-3 font-semibold text-lg" onClick={enterFS}>Enter Fullscreen</button>
            </div>
        </div>
    );

    return (
        <div className="h-screen w-full flex flex-col bg-gray-950 text-gray-100 overflow-hidden font-sans">
            {/* Top Bar */}
            <header className="h-14 flex items-center justify-between px-6 bg-gray-900 border-b border-gray-800 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        {isConnected ? <Wifi size={16} className="text-emerald-500 animate-pulse" /> : <Wifi size={16} className="text-red-500" />}
                        <span className="text-sm text-gray-400">{isConnected ? 'Live' : 'Connecting...'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400">
                        <Sparkles size={11} /> Personalised to your resume
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/8 text-xs text-gray-400">
                        Q {questionIdx + 1}/{totalQuestions}
                    </div>
                </div>
                <div className="font-mono text-xl tracking-wider text-gray-300 font-bold">{formatTime(timer)}</div>
                <button onClick={handleEndInterview} className="flex items-center gap-2 px-4 py-1.5 rounded bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors text-sm font-medium">
                    <StopCircle size={16} /> End Interview
                </button>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* LEFT: AI Panel */}
                <section className="w-[300px] border-r border-gray-800 bg-gray-900/50 flex flex-col p-6 items-center shrink-0">
                    <h2 className="text-lg font-bold text-gray-200 mb-6">AI Interviewer</h2>
                    <div className="relative w-32 h-32 flex items-center justify-center mb-3">
                        {aiStatus === 'Speaking' && <>
                            <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-ping opacity-60" />
                            <div className="absolute inset-2 rounded-full border border-purple-500/40 animate-[ping_1.5s_ease-out_infinite]" style={{ animationDelay: '0.3s' }} />
                        </>}
                        <div className={`relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg transition-all duration-500 ${aiStatus === 'Speaking' ? 'shadow-[0_0_30px_rgba(99,102,241,0.6)] scale-105' : ''}`}>
                            <Brain size={40} className="text-white opacity-80" />
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 h-8 mb-4">
                        {aiStatus === 'Listening' && <span className="text-emerald-400 text-sm font-medium flex items-center gap-1"><Mic size={14} /> Listening</span>}
                        {aiStatus === 'Speaking' && <span className="text-indigo-400 text-sm font-medium flex items-center gap-1"><Radio className="animate-pulse" size={14} /> Speaking</span>}
                        {aiStatus === 'Thinking' && <span className="text-purple-400 text-sm font-medium">Thinking<span className="animate-bounce">.</span><span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span><span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span></span>}
                    </div>
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
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${currentQuestion.difficulty === 'Easy' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : currentQuestion.difficulty === 'Medium' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
                                    {currentQuestion.difficulty}
                                </span>
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

                {/* CENTER: Code Editor */}
                <section className="flex-1 flex flex-col bg-[#1e1e1e] min-w-0">
                    <div className="h-12 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 shrink-0">
                        <select value={language} onChange={e => setLanguage(e.target.value)}
                            className="bg-gray-800 text-gray-300 text-sm rounded border border-gray-700 px-3 py-1 focus:outline-none focus:border-indigo-500">
                            <option value="javascript">JavaScript</option>
                            <option value="java">Java</option>
                            <option value="python">Python</option>
                            <option value="cpp">C++</option>
                        </select>
                        <div className="flex items-center gap-2">
                            {submitResult && <span className={`text-xs px-3 py-1 rounded-full ${submitResult.startsWith('✓') ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>{submitResult}</span>}
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm border border-gray-700 transition-colors">
                                <Play size={14} className="text-emerald-400" /> Run
                            </button>
                            <button onClick={handleSubmitCode} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-medium shadow-lg transition-colors">
                                <CheckCircle size={14} /> Submit
                            </button>
                        </div>
                    </div>
                    <div className="flex-1">
                        <Editor height="100%" language={language} theme="vs-dark" value={code} onChange={v => setCode(v || '')}
                            options={{ minimap: { enabled: false }, fontSize: 15, fontFamily: "'JetBrains Mono', monospace", padding: { top: 16 }, scrollBeyondLastLine: false }} />
                    </div>
                </section>

                {/* RIGHT: Transcript */}
                <section className="w-[360px] border-l border-gray-800 bg-gray-900 flex flex-col shrink-0">
                    <div className="h-12 border-b border-gray-800 flex items-center px-4 shrink-0">
                        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Live Transcript</h2>
                        {isInterviewComplete && <span className="ml-auto text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Complete ✓</span>}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`max-w-[88%] rounded-xl p-3 text-sm leading-relaxed ${msg.sender === 'ai' ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-100 self-start rounded-tl-sm' : msg.sender === 'user' ? 'bg-gray-800 border border-gray-700 text-gray-200 self-end rounded-tr-sm' : 'bg-emerald-500/10 text-emerald-400 text-xs self-center border border-emerald-500/20 px-4 py-1 rounded-full'}`}>
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
                                className={`w-12 h-12 rounded-full flex shrink-0 items-center justify-center transition-all ${isListening ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                {isListening ? <Mic size={22} className="text-white" /> : <MicOff size={22} className="text-gray-300" />}
                            </button>
                            <div className="flex-1 flex items-center justify-center gap-1 mx-3 h-8">
                                {isListening
                                    ? [1, 2, 3, 4, 5, 6, 7].map(i => <div key={i} className="w-1.5 bg-red-400 rounded-full" style={{ height: '60%', animation: `waveform 0.8s ease-in-out ${i * 0.1}s infinite alternate` }} />)
                                    : <span className="text-xs text-gray-500">Click mic to speak</span>
                                }
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <style>{`@keyframes waveform { 0% { transform: scaleY(0.3); } 100% { transform: scaleY(1.3); } }`}</style>
        </div>
    );
};

export default InterviewRoom;
