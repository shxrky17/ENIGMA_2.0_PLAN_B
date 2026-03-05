import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import {
    ChevronLeft, Brain, AlertCircle, CheckCircle,
    Lightbulb, ChevronDown, ChevronUp, Download,
    Target, Star, Cpu, Award, Volume2, Activity,
    ClipboardList, Loader2, Sparkles, MessageSquare,
    TrendingUp, Zap, FileText
} from 'lucide-react';
import './Report.css';
import { getReport, generateMoreFollowUps } from '../services/interviewApi';
import type { ReportData, ScoreItem, LogicalStep, FollowUpQuestion } from '../services/interviewApi';

// ── Sub-components ─────────────────────────────────────────────────────────────
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

const ScoreCard: React.FC<{ title: string; score: number; icon: React.ReactNode; colorClass: string; barColor: string; breakdown: ScoreItem[]; }> = ({ title, score, icon, colorClass, barColor, breakdown }) => (
    <div className="glass-panel p-7 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${colorClass}`}>{icon}</div>
                <h3 className="font-bold">{title}</h3>
            </div>
            <div className={`text-xl font-bold ${colorClass.split(' ')[1]}`}>{score}/100</div>
        </div>
        <div className="space-y-4 mt-auto">
            {breakdown.map((item, i) => (
                <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-200">{item.label}</span>
                        <span className="text-gray-500">{item.score}/100</span>
                    </div>
                    <ScoreBar score={item.score} max={100} color={barColor} />
                    {item.note ? <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.note}</p> : null}
                </div>
            ))}
        </div>
    </div>
);



// ── Main Component ─────────────────────────────────────────────────────────────
const Report: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const reportRef = useRef<HTMLDivElement>(null);

    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [expandedStep, setExpandedStep] = useState<number | null>(null);
    const [generatingMore, setGeneratingMore] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [extraQuestions, setExtraQuestions] = useState<FollowUpQuestion[]>([]);

    useEffect(() => {
        if (!id) { setLoading(false); setError(true); return; }
        getReport(id)
            .then(report => { setData(report); setLoading(false); })
            .catch(() => { setLoading(false); setError(true); });
    }, [id]);

    const scoreColor = (s: number) => s >= 80 ? 'text-emerald-400' : s >= 60 ? 'text-amber-400' : 'text-red-400';
    const scoreLabel = (s: number) => s >= 85 ? 'Excellent' : s >= 70 ? 'Good' : s >= 55 ? 'Average' : 'Needs Work';

    const generateMore = async () => {
        if (!id) return;
        setGeneratingMore(true);
        try {
            const newQ = await generateMoreFollowUps(id);
            setExtraQuestions(prev => [...prev, ...newQ]);
        } catch { /* silent */ }
        finally { setGeneratingMore(false); }
    };

    const handleExportPdf = async () => {
        if (!data || !id || !reportRef.current) return;
        setExportingPdf(true);
        try {
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 14;
            const contentWidth = pageWidth - margin * 2;
            let y = margin;
            const allFollowUps = [...(data.followUpQuestions ?? []), ...extraQuestions];
            const answeredQuestionsForPdf = (data.interviewContext ?? [])
                .filter((entry) => entry.question?.trim() && entry.answer?.trim())
                .map((entry) => ({
                    question: entry.question.trim(),
                    answer: entry.answer.trim(),
                }));

            const ensureSpace = (needed = 7) => {
                if (y + needed > pageHeight - margin) {
                    pdf.addPage();
                    y = margin;
                }
            };

            const addLine = (text = '', size = 11, weight: 'normal' | 'bold' = 'normal') => {
                ensureSpace(size * 0.6 + 2);
                pdf.setFont('helvetica', weight);
                pdf.setFontSize(size);
                pdf.text(text, margin, y);
                y += size * 0.6 + 2;
            };

            const addParagraph = (text = '', size = 11) => {
                const lines = pdf.splitTextToSize(text || '-', contentWidth) as string[];
                for (const line of lines) {
                    addLine(line, size, 'normal');
                }
            };

            const addSection = (title: string) => {
                y += 2;
                ensureSpace(10);
                pdf.setDrawColor(220, 220, 220);
                pdf.line(margin, y, pageWidth - margin, y);
                y += 5;
                addLine(title, 13, 'bold');
            };

            addLine(`Interview Report #${id.slice(0, 8)}`, 18, 'bold');
            addLine(`Role: ${data.role || '-'}`, 11);
            addLine(`Date: ${data.date || '-'} | Duration: ${data.duration || '-'}`, 11);
            addLine(`Overall Score: ${data.overall ?? 0}/100`, 12, 'bold');

            addSection('Summary');
            addParagraph(data.logicalAnalysis?.summary || 'No summary available.');

            addSection('Scores');
            addLine(`Technical: ${data.technical?.score ?? 0}/100`, 11, 'bold');
            (data.technical?.breakdown ?? []).forEach((b) => addLine(`- ${b.label}: ${b.score}/100`, 10));
            addLine(`Communication: ${data.communication?.score ?? 0}/100`, 11, 'bold');
            (data.communication?.breakdown ?? []).forEach((b) => addLine(`- ${b.label}: ${b.score}/100`, 10));
            addLine(`Logical Reasoning: ${data.logicalReasoningScore ?? 0}/100`, 11);
            addLine(`Problem Speed: ${data.problemSpeedScore ?? 0}/100`, 11);

            if ((data.logicalAnalysis?.steps?.length ?? 0) > 0) {
                addSection('Logical Analysis');
                data.logicalAnalysis.steps.forEach((step, idx) => {
                    addLine(`${idx + 1}. ${step.phase} (Rating: ${step.rating}/5)`, 11, 'bold');
                    addParagraph(step.detail || '-');
                });
            }

            addSection('Strengths');
            if ((data.strengths ?? []).length === 0) addLine('- None recorded', 10);
            (data.strengths ?? []).forEach((s) => addParagraph(`- ${s}`, 10));

            addSection('Areas to Improve');
            if ((data.improvements ?? []).length === 0) addLine('- None recorded', 10);
            (data.improvements ?? []).forEach((s) => addParagraph(`- ${s}`, 10));

            if ((data.personalisation?.skills?.length ?? 0) > 0) {
                addSection('Skills Assessed');
                addParagraph(data.personalisation.skills.join(', '), 10);
            }

            if (answeredQuestionsForPdf.length > 0) {
                addSection('Questions You Answered');
                answeredQuestionsForPdf.forEach((q, idx) => {
                    addLine(`${idx + 1}. Question`, 10, 'bold');
                    addParagraph(q.question, 10);
                    addLine('Answer', 10, 'bold');
                    addParagraph(q.answer, 10);
                });
            }

            addSection('Practice Follow-up Questions');
            if (allFollowUps.length === 0) addLine('- None generated', 10);
            allFollowUps.forEach((q, idx) => {
                addLine(`${idx + 1}. (${q.difficulty} | ${q.topic})`, 10, 'bold');
                addParagraph(q.question, 10);
            });

            if ((data.codeApproach?.length ?? 0) > 0 || (data.codeSubmissions?.length ?? 0) > 0) {
                addSection('Code Approach Analysis');
                (data.codeApproach ?? []).forEach((item, idx) => {
                    addLine(`${idx + 1}. ${item.title || `Attempt ${idx + 1}`} (Rating: ${item.rating || 3}/5)`, 10, 'bold');
                    addParagraph(item.summary || '-', 10);
                });
                (data.codeSubmissions ?? []).forEach((sub, idx) => {
                    addLine(`Submission ${idx + 1}: ${sub.language?.toUpperCase() || 'CODE'} | ${sub.passed ? 'PASS' : 'FAIL'}`, 10, 'bold');
                    addParagraph(sub.questionText || '-', 10);
                    const codePreview = (sub.code || '').slice(0, 600);
                    if (codePreview) addParagraph(`Code: ${codePreview}`, 9);
                });
            }

            pdf.save(`interview-feedback-${id}.pdf`);
        } catch (e) {
            console.error('PDF export failed', e);
            window.alert('PDF download failed. Please try again.');
        } finally {
            setExportingPdf(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-4 text-gray-400">
                <Loader2 size={40} className="animate-spin text-indigo-500" />
                <p className="font-medium">Generating your AI report…</p>
                <p className="text-xs text-gray-600">Analysing your transcript with Gemini AI</p>
            </div>
        </div>
    );

    if (error || !data) return (
        <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                <AlertCircle size={40} className="text-red-500" />
                <h2 className="text-xl font-semibold text-white">Report Not Found</h2>
                <p className="text-sm text-gray-500">The report may still be generating. Please wait and try again.</p>
                <div className="flex gap-3">
                    <button onClick={() => window.location.reload()}
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors">Retry</button>
                    <button onClick={() => navigate('/dashboard')}
                        className="px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 text-sm transition-colors">Dashboard</button>
                </div>
            </div>
        </div>
    );

    const allFollowUps = [...(data.followUpQuestions ?? []), ...extraQuestions];
    const overallLabel = scoreLabel(data.overall);
    const answeredQuestions = (data.interviewContext ?? [])
        .filter((entry) => entry.question?.trim() && entry.answer?.trim())
        .map((entry) => ({
            question: entry.question.trim(),
            answer: entry.answer.trim(),
        }));
    const scorePairs = [
        { name: 'Technical', value: data.technical?.score ?? 0 },
        { name: 'Communication', value: data.communication?.score ?? 0 },
        { name: 'Logical', value: data.logicalReasoningScore ?? 0 },
        { name: 'Speed', value: data.problemSpeedScore ?? 0 },
    ];
    const strongestArea = scorePairs.reduce((best, current) => (current.value > best.value ? current : best), scorePairs[0]);

    return (
        <div className="max-w-6xl mx-auto animation-fade-in pb-16 px-4 sm:px-6" ref={reportRef}>

            {/* ── Header ── */}
            <div className="flex items-start justify-between mb-10">
                <div>
                    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-4 transition-colors">
                        <ChevronLeft size={16} /> Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold mb-1">Interview Report <span className="gradient-text">#</span>{id?.slice(0, 8)}</h1>
                    <p className="text-gray-500 text-sm">{data.role} · {data.date} · {data.duration}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExportPdf} disabled={exportingPdf}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm transition-colors font-medium">
                        {exportingPdf ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                        {exportingPdf ? 'Generating PDF…' : 'Download PDF'}
                    </button>
                    <button onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-sm transition-colors">
                        <FileText size={15} /> New Interview
                    </button>
                </div>
            </div>

            {/* ── Overall Score Banner ── */}
            <div className="glass-panel p-7 mb-7">
                <div className="flex items-center gap-2 mb-4">
                    <ClipboardList size={18} className="text-cyan-400" />
                    <h3 className="font-bold">Quick Analysis</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Overall Verdict</p>
                        <p className="text-sm text-gray-200 leading-relaxed">{overallLabel} performance with score {data.overall}/100.</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Strongest Area</p>
                        <p className="text-sm text-gray-200 leading-relaxed">{strongestArea.name} ({strongestArea.value}/100)</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Top Improvement Priority</p>
                        <p className="text-sm text-gray-200 leading-relaxed">{data.improvements?.[0] ?? 'Keep practicing with structured answers.'}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Next Practice Step</p>
                        <p className="text-sm text-gray-200 leading-relaxed">{allFollowUps?.[0]?.question ?? 'Revisit your weakest section and solve 2 targeted questions.'}</p>
                    </div>
                </div>
            </div>

            <div className="glass-panel p-8 mb-7">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="relative w-28 h-28 shrink-0">
                            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="42" stroke="#1f2937" strokeWidth="10" fill="none" />
                                <circle cx="50" cy="50" r="42" stroke="#8b5cf6" strokeWidth="10" fill="none"
                                    strokeDasharray={`${data.overall * 2.64} 264`} strokeLinecap="round" />
                                <defs><linearGradient id="grad"><stop stopColor="#6366f1" /><stop offset="1" stopColor="#a855f7" /></linearGradient></defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold">{data.overall}</span>
                                <span className="text-xs text-gray-500">/100</span>
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Award size={18} className="text-amber-400" />
                                <h2 className="text-2xl font-bold">Overall Score</h2>
                                <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${data.overall >= 85 ? 'bg-emerald-500/20 text-emerald-400' :
                                    data.overall >= 70 ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-red-500/20 text-red-400'}`}>{overallLabel}</span>
                            </div>
                            <p className="text-gray-400 text-sm max-w-md">{data.logicalAnalysis?.summary}</p>
                        </div>
                    </div>

                    {/* 4 Score Pills */}
                    <div className="grid grid-cols-2 gap-4 text-center">
                        {[
                            { label: 'Technical', val: data.technical?.score ?? 0, icon: <Cpu size={16} />, color: 'text-indigo-400' },
                            { label: 'Communication', val: data.communication?.score ?? 0, icon: <Volume2 size={16} />, color: 'text-purple-400' },
                            { label: 'Logical', val: data.logicalReasoningScore ?? 0, icon: <Brain size={16} />, color: 'text-amber-400' },
                            { label: 'Speed', val: data.problemSpeedScore ?? 0, icon: <Zap size={16} />, color: 'text-emerald-400' },
                        ].map(item => (
                            <div key={item.label} className="flex flex-col items-center gap-1 bg-white/[0.03] rounded-xl px-4 py-3">
                                <div className={`flex items-center gap-1.5 text-xs ${item.color}`}>
                                    {item.icon}<span>{item.label}</span>
                                </div>
                                <div className={`text-2xl font-bold ${scoreColor(item.val)}`}>{item.val}</div>
                                <div className="text-xs text-gray-600">{scoreLabel(item.val)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Score Breakdowns ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-7">
                <ScoreCard
                    title="Technical Score"
                    score={data.technical?.score ?? 0}
                    icon={<Cpu size={16} className="text-indigo-300" />}
                    colorClass="bg-indigo-500/20 text-indigo-400"
                    barColor="bg-indigo-500"
                    breakdown={data.technical?.breakdown ?? []}
                />
                <ScoreCard
                    title="Communication Score"
                    score={data.communication?.score ?? 0}
                    icon={<Volume2 size={16} className="text-purple-300" />}
                    colorClass="bg-purple-500/20 text-purple-400"
                    barColor="bg-purple-500"
                    breakdown={data.communication?.breakdown ?? []}
                />
            </div>

            {/* ── Logical Analysis ── */}
            {data.logicalAnalysis?.steps?.length > 0 && (
                <div className="glass-panel p-7 mb-7">
                    <div className="flex items-center gap-2 mb-5">
                        <Activity size={18} className="text-amber-400" />
                        <h3 className="font-bold">Logical Analysis — How You Thought Through the Problems</h3>
                    </div>
                    <div className="space-y-3">
                        {data.logicalAnalysis.steps.map((step: LogicalStep, i: number) => (
                            <div key={i} className="border border-white/5 rounded-xl overflow-hidden">
                                <button
                                    className="w-full flex items-center justify-between p-4 hover:bg-white/[0.03] transition-colors"
                                    onClick={() => setExpandedStep(expandedStep === i ? null : i)}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-full bg-amber-500/15 text-amber-400 text-xs flex items-center justify-center font-bold">{i + 1}</div>
                                        <span className="font-medium text-sm">{step.phase}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <StarRating value={step.rating} />
                                        {expandedStep === i ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                                    </div>
                                </button>
                                {expandedStep === i && (
                                    <div className="px-4 pb-4">
                                        <p className="text-sm text-gray-400 pl-10">{step.detail}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Strengths & Improvements ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-7">
                <div className="glass-panel p-7">
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle size={18} className="text-emerald-400" />
                        <h3 className="font-bold">Strengths</h3>
                    </div>
                    <div className="space-y-3">
                        {(data.strengths ?? []).map((s, i) => (
                            <div key={i} className="flex items-start gap-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
                                <TrendingUp size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                                <p className="text-sm text-gray-300">{s}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="glass-panel p-7">
                    <div className="flex items-center gap-2 mb-4">
                        <Target size={18} className="text-amber-400" />
                        <h3 className="font-bold">Areas to Improve</h3>
                    </div>
                    <div className="space-y-3">
                        {(data.improvements ?? []).map((s, i) => (
                            <div key={i} className="flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
                                <Lightbulb size={14} className="text-amber-400 mt-0.5 shrink-0" />
                                <p className="text-sm text-gray-300">{s}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Skills & Questions Assessed ── */}
            {((data.personalisation?.skills?.length ?? 0) > 0 || answeredQuestions.length > 0) && (
                <div className="glass-panel p-7 mb-7">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={18} className="text-indigo-400" />
                        <h3 className="font-bold">Resume Keywords Assessed in This Interview</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {(data.personalisation?.skills ?? []).map((skill, i) => (
                            <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium">
                                {skill}
                            </span>
                        ))}
                    </div>
                    <div className="space-y-3">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Questions You Answered</p>
                        {answeredQuestions.length > 0 ? answeredQuestions.map((q, i) => (
                            <div key={i} className="p-4 bg-white/[0.02] rounded-xl border border-white/10">
                                <div className="flex items-start gap-3">
                                    <MessageSquare size={14} className="text-gray-500 mt-0.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Question {i + 1}</p>
                                        <p className="text-sm text-gray-200 leading-relaxed">{q.question}</p>
                                        <div className="mt-3 pt-3 border-t border-white/10">
                                            <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Your answer</p>
                                            <p className="text-sm text-gray-300 leading-relaxed">{q.answer}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-gray-500">Only answered interview questions appear here.</p>
                        )}
                    </div>
                </div>
            )}

            {/* ── Follow-up Questions ── */}
            <div className="glass-panel p-7 mb-7">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Brain size={18} className="text-purple-400" />
                        <h3 className="font-bold">Practice Follow-up Questions</h3>
                    </div>
                    <button onClick={generateMore} disabled={generatingMore}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 transition-colors disabled:opacity-50">
                        {generatingMore ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        {generatingMore ? 'Generating…' : 'Generate More'}
                    </button>
                </div>
                <div className="space-y-3">
                    {allFollowUps.map((q, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 bg-white/[0.02] rounded-lg border border-white/5 hover:border-purple-500/20 transition-colors">
                            <div className="w-6 h-6 rounded-full bg-purple-500/15 text-purple-400 text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-300">{q.question}</p>
                                <div className="flex gap-2 mt-2">
                                    <DifficultyBadge level={q.difficulty} />
                                    <span className="text-xs text-gray-600">{q.topic}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {allFollowUps.length === 0 && !generatingMore && (
                        <p className="text-sm text-gray-500 text-center py-4">Click "Generate More" to get AI-generated follow-up questions based on your interview.</p>
                    )}
                </div>
            </div>

            {/* ── Action Buttons ── */}
            {(data.codeApproach?.length || data.codeSubmissions?.length) ? (
                <div className="glass-panel p-7 mb-7">
                    <div className="flex items-center gap-2 mb-4">
                        <Cpu size={18} className="text-cyan-400" />
                        <h3 className="font-bold">Code Approach Analysis</h3>
                    </div>

                    {(data.codeApproach ?? []).length > 0 && (
                        <div className="space-y-3">
                            {(data.codeApproach ?? []).map((item, idx) => (
                                <div key={idx} className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <p className="text-sm font-semibold text-cyan-300">{item.title || `Attempt ${idx + 1}`}</p>
                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                                            {Math.max(1, Math.min(5, item.rating || 3))}/5
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-200">{item.summary}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {(data.codeSubmissions ?? []).length > 0 && (
                        <div className="mt-5 space-y-3">
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Submitted Code Attempts</p>
                            {(data.codeSubmissions ?? []).map((sub, idx) => (
                                <div key={idx} className="p-3 rounded-lg bg-white/[0.02] border border-white/10">
                                    <div className="flex items-center justify-between text-xs mb-2">
                                        <span className="text-indigo-300">{sub.language?.toUpperCase() || 'CODE'}</span>
                                        <span className={sub.passed ? 'text-emerald-400' : 'text-red-400'}>
                                            {sub.passed ? 'PASS' : 'FAIL'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300 mb-2">{sub.questionText}</p>
                                    <pre className="text-xs text-gray-200 bg-gray-900/60 border border-gray-800 rounded-lg p-3 overflow-x-auto max-h-48">
                                        {sub.code}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={handleExportPdf} disabled={exportingPdf}
                    className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-60">
                    {exportingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                    {exportingPdf ? 'Generating PDF Report…' : 'Download Full PDF Report'}
                </button>
                <button onClick={() => navigate('/')}
                    className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-white/10 hover:bg-white/[0.05] text-sm font-medium transition-colors">
                    <ClipboardList size={18} />
                    Start New Interview
                </button>
            </div>
        </div>
    );
};

export default Report;



