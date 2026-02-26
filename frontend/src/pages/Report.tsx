import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Brain, TrendingUp, AlertCircle, CheckCircle,
    Lightbulb, ChevronDown, ChevronUp, RefreshCw, BookOpen,
    Target, Star, ArrowRight, Cpu, BarChart2, Award, Volume2,
    ClipboardList, Users, Loader2, Sparkles
} from 'lucide-react';
import './Report.css';
import { getReport } from '../services/interviewApi';
import type { ReportData, ScoreItem, LogicalStep, FollowUpQuestion, QuestionAsked } from '../services/interviewApi';

// ── Fallback mock ─────────────────────────────────────────────────────────────
const MOCK: ReportData = {
    overall: 88, role: 'Software Engineer', date: 'February 26, 2026', duration: '43m 12s',
    technical: {
        score: 92,
        breakdown: [
            { label: 'Code Correctness', score: 95, max: 100, note: 'All 3 test cases passed.' },
            { label: 'Time Complexity', score: 90, max: 100, note: 'Correctly identified O(N) HashMap solution.' },
            { label: 'Space Complexity', score: 80, max: 100, note: 'O(N) space — two-pointer could do O(1).' },
            { label: 'Code Readability', score: 88, max: 100, note: 'Clean and structured. Minor naming improvements.' },
            { label: 'Edge Case Handling', score: 70, max: 100, note: 'Missing null return for no-result scenario.' },
            { label: 'Best Practices', score: 92, max: 100, note: 'No magic numbers, correct idioms.' },
        ],
    },
    communication: {
        score: 85,
        breakdown: [
            { label: 'Problem Articulation', score: 92, max: 100, note: 'Restated the problem clearly upfront.' },
            { label: 'Thought Narration', score: 88, max: 100, note: 'Walked through logic consistently.' },
            { label: 'Technical Vocabulary', score: 80, max: 100, note: 'Good use of HashMap, complement, iteration.' },
            { label: 'Response to Follow-ups', score: 75, max: 100, note: 'Slightly hesitant on complexity questions.' },
            { label: 'Confidence & Clarity', score: 82, max: 100, note: 'Confident overall; minor uncertainty on trade-offs.' },
            { label: 'Active Listening', score: 90, max: 100, note: 'Incorporated interviewer hints well.' },
        ],
    },
    logicalAnalysis: {
        summary: 'The candidate showed a structured approach — quickly moving from brute-force to an optimal O(N) solution.',
        steps: [
            { phase: 'Problem Understanding', rating: 5, detail: 'Re-stated the problem, confirmed edge cases.' },
            { phase: 'Initial Approach', rating: 3, detail: 'Started with O(N²) brute-force, then self-corrected.' },
            { phase: 'Optimization', rating: 5, detail: 'Arrived at HashMap O(N) independently.' },
            { phase: 'Code Implementation', rating: 4, detail: 'Clean code, all tests passed, minor issues.' },
            { phase: 'Communication', rating: 4, detail: 'Good narration, slight hesitation under pressure.' },
        ],
    },
    followUpQuestions: [
        { question: 'How would you modify if the same element cannot be used twice?', difficulty: 'Easy', topic: 'Arrays' },
        { question: 'How would you solve this if the array is too large for memory?', difficulty: 'Hard', topic: 'System Design' },
        { question: 'Can you implement the same logic using Array.prototype.reduce?', difficulty: 'Medium', topic: 'Functional JS' },
    ],
    strengths: ['Excellent React component lifecycle understanding.', 'Clear articulation of state management.', 'Arrived at O(N) independently.'],
    improvements: ['Handle edge cases before writing core logic.', 'More confidence on Big-O under pressure.'],
    personalisation: {
        skills: ['React', 'TypeScript', 'Spring Boot', 'Data Structures'],
        questionsAsked: [
            { skill: 'React', question: 'Controlled vs Uncontrolled components', difficulty: 'Medium' },
            { skill: 'Data Structures', question: 'Two Sum — HashMap approach', difficulty: 'Medium' },
            { skill: 'TypeScript', question: 'Generic types with practical examples', difficulty: 'Medium' },
        ],
    },
};

// ── Sub-components ────────────────────────────────────────────────────────────
const DifficultyBadge: React.FC<{ level: string }> = ({ level }) => {
    const c: Record<string, string> = {
        Easy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        Hard: 'bg-red-500/15 text-red-400 border-red-500/30',
    };
    return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${c[level] ?? 'bg-gray-700 text-gray-300 border-gray-600'}`}>{level}</span>;
};

const StarRating: React.FC<{ value: number }> = ({ value }) => (
    <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={14} className={i < value ? 'text-amber-400 fill-amber-400' : 'text-gray-700 fill-gray-700'} />
        ))}
    </div>
);

const ScoreBar: React.FC<{ score: number; max: number; color: string }> = ({ score, max, color }) => (
    <div className="h-2 w-full rounded-full bg-gray-800 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${(score / max) * 100}%` }} />
    </div>
);

const ScoreCard: React.FC<{ title: string; score: number; icon: React.ReactNode; color: string; breakdown: ScoreItem[] }> =
    ({ title, score, icon, color, breakdown }) => (
        <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
                    <h3 className="font-bold">{title}</h3>
                </div>
                <div className="text-3xl font-bold gradient-text">{score}</div>
            </div>
            <div className="space-y-4">
                {breakdown.map((item: ScoreItem, i: number) => (
                    <div key={i}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="text-gray-400">{item.label}</span>
                            <span className="font-bold text-white">{item.score}/{item.max}</span>
                        </div>
                        <ScoreBar score={item.score} max={item.max} color={color.includes('indigo') ? 'bg-indigo-500' : color.includes('purple') ? 'bg-purple-500' : 'bg-emerald-500'} />
                        <p className="text-xs text-gray-500 mt-1">{item.note}</p>
                    </div>
                ))}
            </div>
        </div>
    );

// ── Main Component ────────────────────────────────────────────────────────────
const Report: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [data, setData] = useState<ReportData>(MOCK);
    const [loading, setLoading] = useState(true);
    const [expandedStep, setExpandedStep] = useState<number | null>(null);
    const [generatingMore, setGeneratingMore] = useState(false);
    const [extraQuestions, setExtraQuestions] = useState<FollowUpQuestion[]>([]);

    useEffect(() => {
        if (!id) { setLoading(false); return; }
        getReport(id)
            .then(report => { setData(report); setLoading(false); })
            .catch(() => { setLoading(false); }); // fall back to MOCK on error
    }, [id]);

    const scoreColor = (s: number) => s >= 90 ? 'text-emerald-400' : s >= 75 ? 'text-amber-400' : 'text-red-400';

    const generateMore = () => {
        setGeneratingMore(true);
        setTimeout(() => {
            setExtraQuestions([
                { question: 'How would Binary Search compare in a sorted array?', difficulty: 'Medium', topic: 'Algorithms' },
                { question: 'Design a cache using HashMap + LinkedList.', difficulty: 'Hard', topic: 'System Design' },
            ]);
            setGeneratingMore(false);
        }, 1500);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-4 text-gray-400">
                <Loader2 size={40} className="animate-spin text-indigo-500" />
                <p>Loading your interview report...</p>
            </div>
        </div>
    );

    const allFollowUps = [...data.followUpQuestions, ...extraQuestions];

    return (
        <div className="max-w-6xl mx-auto animation-fade-in pb-16">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-4 transition-colors">
                        <ChevronLeft size={16} /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold mb-1">Interview Report <span className="gradient-text">#</span>{id?.slice(0, 6)}</h1>
                    <p className="text-gray-500 text-sm">{data.role} · {data.date} · {data.duration}</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-sm transition-colors">
                    <ClipboardList size={16} /> Export PDF
                </button>
            </div>

            {/* Overall Score Banner */}
            <div className="glass-panel p-8 mb-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="relative w-28 h-28 shrink-0">
                        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" stroke="#1f2937" strokeWidth="10" fill="none" />
                            <circle cx="50" cy="50" r="42" stroke="url(#grad)" strokeWidth="10" fill="none"
                                strokeDasharray={`${data.overall * 2.64} 264`} strokeLinecap="round" />
                            <defs><linearGradient id="grad"><stop stopColor="#6366f1" /><stop offset="1" stopColor="#a855f7" /></linearGradient></defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold">{data.overall}</span>
                            <span className="text-xs text-gray-500">/100</span>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-1">Overall Score</h2>
                        <p className="text-gray-400 text-sm max-w-xs">{data.logicalAnalysis.summary}</p>
                    </div>
                </div>
                <div className="flex gap-8 text-center">
                    {[
                        { label: 'Technical', value: data.technical.score, icon: <Cpu size={18} /> },
                        { label: 'Communication', value: data.communication.score, icon: <Volume2 size={18} /> },
                    ].map(item => (
                        <div key={item.label} className="flex flex-col items-center gap-1">
                            <div className={`text-3xl font-bold ${scoreColor(item.value)}`}>{item.value}</div>
                            <div className="flex items-center gap-1 text-gray-500 text-xs">{item.icon} {item.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Score Breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <ScoreCard title="Technical Score" score={data.technical.score} icon={<Cpu size={16} className="text-indigo-300" />} color="bg-indigo-500/20 text-indigo-400" breakdown={data.technical.breakdown} />
                <ScoreCard title="Communication Score" score={data.communication.score} icon={<Volume2 size={16} className="text-purple-300" />} color="bg-purple-500/20 text-purple-400" breakdown={data.communication.breakdown} />
            </div>

            {/* Resume Personalisation Summary */}
            {data.personalisation?.skills?.length > 0 && (
                <div className="glass-panel p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={18} className="text-indigo-400" />
                        <h3 className="font-bold">Resume-Personalised Questions</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {data.personalisation.skills.map((s: string) => (
                            <span key={s} className="text-xs px-3 py-1 rounded-full bg-indigo-500/12 border border-indigo-500/25 text-indigo-300">{s}</span>
                        ))}
                    </div>
                    <div className="space-y-2">
                        {data.personalisation.questionsAsked.map((q: QuestionAsked, i: number) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg text-sm">
                                <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300">{i + 1}</span>
                                <span className="flex-1 text-gray-300">{q.question}</span>
                                <span className="text-xs text-gray-500 border-l border-gray-700 pl-3 shrink-0">{q.skill}</span>
                                <DifficultyBadge level={q.difficulty} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="glass-panel p-6">
                    <div className="flex items-center gap-2 mb-4"><Award size={18} className="text-emerald-400" /><h3 className="font-bold">Strengths</h3></div>
                    <ul className="space-y-2">
                        {data.strengths.map((s: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                <CheckCircle size={16} className="text-emerald-400 mt-0.5 shrink-0" /> {s}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="glass-panel p-6">
                    <div className="flex items-center gap-2 mb-4"><Target size={18} className="text-amber-400" /><h3 className="font-bold">Areas to Improve</h3></div>
                    <ul className="space-y-2">
                        {data.improvements.map((s: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" /> {s}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Logical Reasoning Analysis */}
            <div className="glass-panel p-6 mb-6">
                <div className="flex items-center gap-2 mb-2"><Brain size={20} className="text-purple-400" /><h3 className="font-bold text-lg">AI Logical Reasoning Analysis</h3></div>
                <p className="text-gray-400 text-sm mb-5">{data.logicalAnalysis.summary}</p>
                <div className="space-y-2">
                    {data.logicalAnalysis.steps.map((step: LogicalStep, idx: number) => (
                        <div key={idx} className="border border-white/8 rounded-xl overflow-hidden">
                            <button className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                                onClick={() => setExpandedStep(expandedStep === idx ? null : idx)}>
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">{idx + 1}</span>
                                    <span className="font-medium text-sm">{step.phase}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <StarRating value={step.rating} />
                                    {expandedStep === idx ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                                </div>
                            </button>
                            {expandedStep === idx && (
                                <div className="px-4 pb-4 pt-1 text-sm text-gray-400 border-t border-white/5 bg-white/[0.01]">
                                    {step.detail}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Follow-up Questions */}
            <div className="glass-panel p-6">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2"><Lightbulb size={20} className="text-amber-400" /><h3 className="font-bold text-lg">Recommended Follow-up Questions</h3></div>
                    <button onClick={generateMore} disabled={generatingMore}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-xs text-gray-400 transition-colors disabled:opacity-50">
                        <RefreshCw size={13} className={generatingMore ? 'animate-spin' : ''} />
                        {generatingMore ? 'Generating...' : 'Generate More'}
                    </button>
                </div>
                <div className="space-y-3">
                    {allFollowUps.map((q: FollowUpQuestion, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                            <BookOpen size={16} className="text-amber-400 mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm text-gray-200 mb-2">{q.question}</p>
                                <div className="flex items-center gap-2">
                                    <DifficultyBadge level={q.difficulty} />
                                    <span className="text-xs text-gray-500">{q.topic}</span>
                                </div>
                            </div>
                            <ArrowRight size={16} className="text-gray-600 mt-0.5 shrink-0" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Report;
