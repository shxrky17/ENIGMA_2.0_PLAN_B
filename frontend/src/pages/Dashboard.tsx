import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Clock, Code2, MessageSquare, ChevronRight,
    Loader2, Play, Brain, Award, BarChart2
} from 'lucide-react';
import './Dashboard.css';
import { getDashboardHistory } from '../services/interviewApi';
import type { SessionSummary } from '../services/interviewApi';

const ScorePill: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <div className="flex items-center justify-between gap-3 w-full max-w-[140px]">
        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold w-8">{label}</span>
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div 
                className={`h-full rounded-full ${color.split(' ')[0].replace('text-', 'bg-')}`} 
                style={{ width: `${value}%` }} 
            />
        </div>
        <span className={`text-xs font-mono font-bold min-w-[28px] text-right ${color}`}>
            {value > 0 ? `${value}%` : '--'}
        </span>
    </div>
);

const SkillTag: React.FC<{ label: string }> = ({ label }) => (
    <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/5 border border-indigo-500/20 text-indigo-300/80">
        {label}
    </span>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const cfg: Record<string, string> = {
        COMPLETED: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        IN_PROGRESS: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        TERMINATED: 'bg-red-500/10 border-red-500/20 text-red-400',
    };
    return (
        <span className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded border ${cfg[status] ?? cfg.COMPLETED}`}>
            {status.replace('_', ' ')}
        </span>
    );
};

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDashboardHistory()
            .then(data => setSessions(data))
            .catch(() => setSessions([]))
            .finally(() => setLoading(false));
    }, []);

    const completed = sessions.filter(s => s.status === 'COMPLETED');
    const getAvg = (key: keyof SessionSummary) => 
        completed.length ? Math.round(completed.reduce((sum, s) => sum + (s[key] as number), 0) / completed.length) : 0;

    const metrics = [
        { label: 'Overall Perf', value: `${getAvg('overallScore')}%`, sub: 'Average Score', icon: <Award size={20} />, bg: 'bg-indigo-600' },
        { label: 'Technical', value: `${getAvg('technicalScore')}%`, sub: 'Logic & Syntax', icon: <Code2 size={20} />, bg: 'bg-violet-600' },
        { label: 'Communication', value: `${getAvg('communicationScore')}%`, sub: 'Clarity', icon: <MessageSquare size={20} />, bg: 'bg-fuchsia-600' },
        { label: 'Sessions', value: sessions.length, sub: 'Total Interviews', icon: <Brain size={20} />, bg: 'bg-blue-600' },
    ];

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 animation-fade-in pb-16">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">
                        Candidate <span className="text-indigo-500">Dashboard</span>
                    </h1>
                    <p className="text-gray-400 font-medium">Analyze your interview trajectory and skill gaps.</p>
                </div>
                <button onClick={() => navigate('/setup')} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                    <Play size={18} fill="currentColor" /> Start New Session
                </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {metrics.map(m => (
                    <div key={m.label} className="bg-[#111] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                        <div className={`${m.bg} w-10 h-10 rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-black/20`}>
                            {m.icon}
                        </div>
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{m.label}</p>
                        <p className="text-3xl font-black mb-1">{loading ? '...' : m.value}</p>
                        <p className="text-xs text-gray-600">{m.sub}</p>
                    </div>
                ))}
            </div>

            {/* Table Section */}
            <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="px-6 py-5 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BarChart2 size={20} className="text-indigo-500" />
                        <h2 className="text-lg font-bold">Interview History</h2>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                        <Clock size={14} />
                        <span className="text-xs font-medium">Recent Activity</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-white/[0.02] text-[11px] uppercase tracking-widest text-gray-500 font-bold">
                                <th className="text-left px-6 py-4">Date & Time</th>
                                <th className="text-left px-6 py-4">Topic / Domain</th>
                                <th className="text-left px-6 py-4">Level</th>
                                <th className="text-left px-6 py-4">Metric Breakdown</th>
                                <th className="text-left px-6 py-4 text-center">Status</th>
                                <th className="text-right px-6 py-4">Analysis</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {sessions.map(session => (
                                <tr key={session.sessionId} className="hover:bg-white/[0.02] transition-all group">
                                    <td className="px-6 py-6">
                                        <p className="text-sm font-bold text-gray-200">{session.date}</p>
                                        <p className="text-[10px] text-gray-500 font-mono mt-1">{session.duration}</p>
                                    </td>
                                    <td className="px-6 py-6">
                                        <p className="text-sm font-bold text-indigo-400 mb-2">{session.topic}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {session.skills.slice(0, 3).map(s => <SkillTag key={s} label={s} />)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${
                                            session.difficulty === 'Easy' ? 'text-emerald-500' : 
                                            session.difficulty === 'Medium' ? 'text-amber-500' : 'text-red-500'
                                        }`}>
                                            {session.difficulty}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex flex-col gap-2">
                                            <ScorePill label="AVG" value={session.overallScore} color="text-white" />
                                            <ScorePill label="TCH" value={session.technicalScore} color="text-indigo-400" />
                                            <ScorePill label="COM" value={session.communicationScore} color="text-fuchsia-400" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <StatusBadge status={session.status} />
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        {session.reportId ? (
                                            <button onClick={() => navigate(`/report/${session.reportId}`)} 
                                                className="inline-flex items-center gap-1 text-indigo-400 font-bold text-xs hover:text-white transition-colors">
                                                DETAILS <ChevronRight size={14} />
                                            </button>
                                        ) : (
                                            <span className="text-[10px] text-gray-600 font-bold italic">PENDING</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;