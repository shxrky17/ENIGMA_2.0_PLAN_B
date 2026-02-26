import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, Clock, Code2, MessageSquare, ChevronRight,
    Loader2, Play, Brain, Award, BarChart2
} from 'lucide-react';
import './Dashboard.css';
import { getDashboardHistory } from '../services/interviewApi';
import type { SessionSummary } from '../services/interviewApi';

// Fallback for when backend is unavailable
const MOCK_SESSIONS: SessionSummary[] = [
    {
        sessionId: 'demo-001', reportId: 'report-001', topic: 'Arrays', difficulty: 'Medium',
        overallScore: 88, technicalScore: 85, communicationScore: 92,
        status: 'COMPLETED', date: 'February 26, 2026', duration: '43m 12s',
        skills: ['React', 'TypeScript', 'Data Structures'],
    },
    {
        sessionId: 'demo-002', reportId: 'report-002', topic: 'Graphs', difficulty: 'Hard',
        overallScore: 76, technicalScore: 72, communicationScore: 82,
        status: 'COMPLETED', date: 'February 20, 2026', duration: '38m 05s',
        skills: ['Java', 'Spring Boot', 'Algorithms'],
    },
    {
        sessionId: 'demo-003', reportId: null, topic: 'Trees', difficulty: 'Easy',
        overallScore: 0, technicalScore: 0, communicationScore: 0,
        status: 'IN_PROGRESS', date: 'February 15, 2026', duration: 'N/A',
        skills: ['Python', 'DSA'],
    },
];

const ScorePill: React.FC<{ value: number; color: string }> = ({ value, color }) => (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
        {value > 0 ? value : '--'}
    </span>
);

const SkillTag: React.FC<{ label: string }> = ({ label }) => (
    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
        {label}
    </span>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const cfg: Record<string, string> = {
        COMPLETED: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
        IN_PROGRESS: 'bg-amber-500/10 border-amber-500/25 text-amber-400',
        TERMINATED: 'bg-red-500/10 border-red-500/25 text-red-400',
    };
    const label: Record<string, string> = {
        COMPLETED: 'Completed', IN_PROGRESS: 'In Progress', TERMINATED: 'Terminated',
    };
    return (
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${cfg[status] ?? cfg.COMPLETED}`}>
            {label[status] ?? status}
        </span>
    );
};

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDashboardHistory()
            .then(data => setSessions(data.length > 0 ? data : MOCK_SESSIONS))
            .catch(() => setSessions(MOCK_SESSIONS))
            .finally(() => setLoading(false));
    }, []);

    // Derive metrics from real data
    const completed = sessions.filter(s => s.status === 'COMPLETED');
    const avgTech = completed.length
        ? Math.round(completed.reduce((sum, s) => sum + s.technicalScore, 0) / completed.length)
        : 0;
    const avgComm = completed.length
        ? Math.round(completed.reduce((sum, s) => sum + s.communicationScore, 0) / completed.length)
        : 0;
    const avgOverall = completed.length
        ? Math.round(completed.reduce((sum, s) => sum + s.overallScore, 0) / completed.length)
        : 0;

    const metrics = [
        {
            label: 'Avg Overall Score', value: `${avgOverall}%`, sub: `${completed.length} sessions completed`,
            icon: <Award size={22} className="text-white" />, bg: 'bg-gradient-to-br from-indigo-500 to-purple-600',
        },
        {
            label: 'Avg Technical', value: `${avgTech}%`, sub: 'Code & problem solving',
            icon: <Code2 size={22} className="text-white" />, bg: 'bg-gradient-to-br from-violet-500 to-indigo-600',
        },
        {
            label: 'Avg Communication', value: `${avgComm}%`, sub: 'Clarity & narration',
            icon: <MessageSquare size={22} className="text-white" />, bg: 'bg-gradient-to-br from-purple-500 to-pink-600',
        },
        {
            label: 'Total Sessions', value: sessions.length, sub: 'Across all difficulties',
            icon: <Brain size={22} className="text-white" />, bg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
        },
    ];

    return (
        <div className="max-w-6xl mx-auto animation-fade-in pb-16">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-1">
                        Candidate <span className="gradient-text">Dashboard</span>
                    </h1>
                    <p className="text-gray-500 text-sm">Track your performance and progress over time.</p>
                </div>
                <button
                    onClick={() => navigate('/setup')}
                    className="primary-btn flex items-center gap-2 px-5 py-2.5 text-sm font-semibold"
                >
                    <Play size={16} fill="currentColor" /> New Interview
                </button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {metrics.map(m => (
                    <div key={m.label} className="glass-panel p-5 flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${m.bg}`}>
                            {m.icon}
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-0.5">{m.label}</p>
                            <p className="text-2xl font-bold">{loading ? '—' : m.value}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{m.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Sessions Table */}
            <div className="glass-panel overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <BarChart2 size={18} className="text-indigo-400" />
                        <h2 className="font-bold">Interview History</h2>
                        {!loading && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-gray-400 ml-1">
                                {sessions.length}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-600" />
                        <span className="text-xs text-gray-600">Most recent first</span>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
                        <Loader2 size={24} className="animate-spin text-indigo-400" />
                        <span className="text-sm">Loading sessions...</span>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <Brain size={40} className="text-gray-700 mb-3" />
                        <p className="text-sm mb-4">No sessions yet. Start your first interview!</p>
                        <button onClick={() => navigate('/setup')} className="primary-btn px-5 py-2 text-sm">
                            Start Interview
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-white/5">
                                    <th className="text-left px-6 py-3 font-medium">Date</th>
                                    <th className="text-left px-6 py-3 font-medium">Topic / Skills</th>
                                    <th className="text-left px-6 py-3 font-medium">Difficulty</th>
                                    <th className="text-left px-6 py-3 font-medium">Scores</th>
                                    <th className="text-left px-6 py-3 font-medium">Status</th>
                                    <th className="text-left px-6 py-3 font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {sessions.map(session => (
                                    <tr
                                        key={session.sessionId}
                                        className="hover:bg-white/[0.02] transition-colors group"
                                    >
                                        <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                                            {session.date}
                                            <br />
                                            <span className="text-xs text-gray-600">{session.duration}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-200 mb-1.5">{session.topic}</p>
                                            <div className="flex flex-wrap gap-1">
                                                {session.skills.slice(0, 3).map(s => (
                                                    <SkillTag key={s} label={s} />
                                                ))}
                                                {session.skills.length > 3 && (
                                                    <span className="text-xs text-gray-600">+{session.skills.length - 3}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${session.difficulty === 'Easy'
                                                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                                                    : session.difficulty === 'Medium'
                                                        ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                                                        : 'bg-red-500/10 border-red-500/25 text-red-400'
                                                }`}>
                                                {session.difficulty}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-600 w-16">Overall</span>
                                                    <ScorePill
                                                        value={session.overallScore}
                                                        color={
                                                            session.overallScore >= 85
                                                                ? 'bg-indigo-500/15 text-indigo-300'
                                                                : session.overallScore >= 70
                                                                    ? 'bg-amber-500/15 text-amber-300'
                                                                    : session.overallScore > 0
                                                                        ? 'bg-red-500/15 text-red-300'
                                                                        : 'bg-gray-700/50 text-gray-500'
                                                        }
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-600 w-16">Tech</span>
                                                    <ScorePill value={session.technicalScore} color="bg-violet-500/15 text-violet-300" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-600 w-16">Comm</span>
                                                    <ScorePill value={session.communicationScore} color="bg-blue-500/15 text-blue-300" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={session.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            {session.reportId ? (
                                                <button
                                                    onClick={() => navigate(`/report/${session.reportId}`)}
                                                    className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-xs font-medium group-hover:underline transition-colors"
                                                >
                                                    View Report <ChevronRight size={14} />
                                                </button>
                                            ) : session.status === 'IN_PROGRESS' ? (
                                                <button
                                                    onClick={() => navigate(`/interview/${session.sessionId}`)}
                                                    className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-xs font-medium transition-colors"
                                                >
                                                    Resume <ChevronRight size={14} />
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-600">No report</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
