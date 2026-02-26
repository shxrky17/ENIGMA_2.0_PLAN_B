import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    UploadCloud, FileText, X, CheckCircle, Sparkles, Play,
    Layers, Network, Brain, Code2, Cpu, Loader, Plus, Trash2
} from 'lucide-react';
import { uploadResume, startInterview } from '../services/interviewApi';
import type { ResumeProfile, SkillCategory } from '../services/interviewApi';

type Stage = 'upload' | 'processing' | 'review';

const processingSteps = [
    'Parsing document structure...',
    'Extracting work experience...',
    'Identifying technical skills...',
    'Analyzing education history...',
    'Generating skill profile...',
];

const ResumeSetup: React.FC = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [stage, setStage] = useState<Stage>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [processingStep, setProcessingStep] = useState(0);
    const [extracted, setExtracted] = useState<ResumeProfile | null>(null);
    const [difficulty, setDifficulty] = useState('Medium');
    const [topic, setTopic] = useState('Arrays');
    const [newSkill, setNewSkill] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const animateProcessing = () => {
        let step = 0;
        const interval = setInterval(() => {
            step++;
            setProcessingStep(step);
            if (step >= processingSteps.length) clearInterval(interval);
        }, 700);
    };

    const handleFile = async (f: File) => {
        const allowedTypes = ['application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(f.type)) {
            setErrorMsg('Please upload a PDF or Word document (.pdf, .doc, .docx)');
            return;
        }
        setFile(f);
        setStage('processing');
        setErrorMsg('');
        animateProcessing();

        try {
            const profile = await uploadResume(f);
            setExtracted(profile);
        } catch (err) {
            console.error('Upload failed, using fallback profile', err);
            // Fallback profile so the app still works without a backend
            setExtracted({
                name: 'Demo Candidate',
                experience: '2 years',
                education: 'B.Tech Computer Science',
                skillCategories: [
                    { category: 'Languages', color: 'indigo', skills: ['JavaScript', 'TypeScript', 'Python'] },
                    { category: 'Frontend', color: 'purple', skills: ['React', 'CSS'] },
                    { category: 'Backend', color: 'blue', skills: ['Spring Boot', 'Node.js'] },
                    { category: 'DSA & CS', color: 'emerald', skills: ['Data Structures', 'Algorithms'] },
                ],
            });
        } finally {
            setStage('review');
        }
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    }, []);

    const removeSkill = (catIdx: number, skill: string) => {
        if (!extracted) return;
        setExtracted({
            ...extracted,
            skillCategories: extracted.skillCategories.map((c: SkillCategory, i: number) =>
                i === catIdx ? { ...c, skills: c.skills.filter((s: string) => s !== skill) } : c
            ),
        });
    };

    const addSkill = (catIdx: number) => {
        if (!newSkill.trim() || !extracted) return;
        setExtracted({
            ...extracted,
            skillCategories: extracted.skillCategories.map((c: SkillCategory, i: number) =>
                i === catIdx ? { ...c, skills: [...c.skills, newSkill.trim()] } : c
            ),
        });
        setNewSkill('');
    };

    const startInterviewSession = async () => {
        if (!extracted) return;
        const allSkills = extracted.skillCategories.flatMap((c: SkillCategory) => c.skills);
        try {
            const response = await startInterview({
                skills: allSkills,
                difficulty,
                topic,
                candidateName: extracted.name,
                candidateExperience: extracted.experience,
                candidateEducation: extracted.education,
            });
            // Navigate with real sessionId from backend
            navigate(`/interview/${response.sessionId}?skills=${allSkills.join(',')}&difficulty=${difficulty}&topic=${topic}&total=${response.totalQuestions}`);
        } catch (err) {
            console.error('Failed to start session, navigating with local session', err);
            const localId = Math.random().toString(36).substring(7);
            navigate(`/interview/${localId}?skills=${allSkills.join(',')}&difficulty=${difficulty}&topic=${topic}`);
        }
    };

    const colorMap: Record<string, string> = {
        indigo: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
        purple: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
        blue: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
        emerald: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    };
    const dot: Record<string, string> = {
        indigo: 'bg-indigo-400', purple: 'bg-purple-400', blue: 'bg-blue-400', emerald: 'bg-emerald-400',
    };

    const topics = [
        { name: 'Arrays', icon: <Layers size={16} /> },
        { name: 'Trees', icon: <Network size={16} /> },
        { name: 'Graphs', icon: <Network size={16} /> },
        { name: 'DP', icon: <Brain size={16} /> },
    ];

    return (
        <div className="max-w-5xl mx-auto animation-fade-in">
            <div className="mb-10">
                <h1 className="text-4xl font-bold mb-2">
                    AI DSA <span className="gradient-text">Voice Interview</span>
                </h1>
                <p className="text-gray-400 text-lg">Upload your resume — AI will extract your skills and personalise your interview.</p>
            </div>

            {/* UPLOAD */}
            {stage === 'upload' && (
                <div className="glass-panel p-12 flex flex-col items-center text-center">
                    {errorMsg && <p className="text-red-400 text-sm mb-4 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">{errorMsg}</p>}
                    <div
                        className={`w-full max-w-xl border-2 border-dashed rounded-2xl p-16 flex flex-col items-center gap-4 cursor-pointer transition-all ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-white/25 hover:bg-white/[0.03]'}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={onDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all ${isDragging ? 'bg-indigo-500/30' : 'bg-white/5'}`}>
                            <UploadCloud size={40} className={isDragging ? 'text-indigo-400' : 'text-gray-500'} />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold mb-1">Drop your resume here</h2>
                            <p className="text-gray-500 text-sm">PDF, DOC, DOCX — Max 10MB</p>
                        </div>
                        <button className="primary-btn px-6 py-2.5 text-sm flex items-center gap-2" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                            <FileText size={16} /> Browse Files
                        </button>
                        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" hidden onChange={e => e.target.files && handleFile(e.target.files[0])} />
                    </div>
                </div>
            )}

            {/* PROCESSING */}
            {stage === 'processing' && (
                <div className="glass-panel p-12 flex flex-col items-center text-center">
                    <div className="relative w-28 h-28 mb-8">
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                        <div className="absolute inset-3 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Cpu size={28} className="text-indigo-400 animate-pulse" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">AI Analysing Resume</h2>
                    <p className="text-gray-500 text-sm mb-8">{file?.name}</p>
                    <div className="w-full max-w-sm space-y-3">
                        {processingSteps.map((step, i) => (
                            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl text-sm transition-all duration-500 ${i < processingStep ? 'text-gray-400 opacity-60' : i === processingStep ? 'text-white bg-white/5 border border-white/10' : 'text-gray-600'}`}>
                                {i < processingStep ? <CheckCircle size={16} className="text-emerald-500 shrink-0" /> :
                                    i === processingStep ? <Loader size={16} className="text-indigo-400 shrink-0 animate-spin" /> :
                                        <div className="w-4 h-4 rounded-full border border-white/10 shrink-0" />}
                                {step}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* REVIEW */}
            {stage === 'review' && extracted && (
                <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-6">
                        {/* Profile card */}
                        <div className="glass-panel p-6 flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
                                {extracted.name.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-bold">{extracted.name}</h2>
                                <p className="text-gray-400 text-sm">{extracted.education}</p>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                <Sparkles size={14} /> {extracted.experience} experience
                            </div>
                            <button onClick={() => { setStage('upload'); setFile(null); setProcessingStep(0); }}
                                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 border border-white/5">
                                <Trash2 size={14} /> Change
                            </button>
                        </div>

                        {/* Skills */}
                        <div className="glass-panel p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <Code2 size={20} className="text-indigo-400" />
                                <h2 className="text-lg font-bold">AI-Extracted Skills</h2>
                                <span className="ml-auto text-xs text-gray-500">Click × to remove · Add below</span>
                            </div>
                            <div className="space-y-5">
                                {extracted.skillCategories.map((cat: SkillCategory, catIdx: number) => (
                                    <div key={catIdx}>
                                        <div className="flex items-center gap-2 mb-2.5">
                                            <div className={`w-2 h-2 rounded-full ${dot[cat.color] || 'bg-gray-400'}`} />
                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{cat.category}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {cat.skills.map((skill: string) => (
                                                <div key={skill} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border ${colorMap[cat.color] || 'bg-gray-800 border-gray-700 text-gray-300'} group`}>
                                                    {skill}
                                                    <button onClick={() => removeSkill(catIdx, skill)} className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all ml-0.5">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="flex items-center gap-1">
                                                <input
                                                    placeholder={`Add ${cat.category}...`}
                                                    value={newSkill}
                                                    className="w-32 bg-transparent border border-dashed border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-400 placeholder:text-gray-600 focus:outline-none focus:border-white/30 transition-colors"
                                                    onKeyDown={e => { if (e.key === 'Enter') addSkill(catIdx); }}
                                                    onChange={e => setNewSkill(e.target.value)}
                                                />
                                                <button onClick={() => addSkill(catIdx)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors">
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Config */}
                    <div className="space-y-6">
                        <div className="glass-panel p-5">
                            <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm"><Brain size={16} className="text-purple-400" /> Topic</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {topics.map(t => (
                                    <button key={t.name} onClick={() => setTopic(t.name)}
                                        className={`p-3 rounded-xl border text-sm font-medium flex flex-col items-center gap-1.5 transition-all ${topic === t.name ? 'border-indigo-500 bg-indigo-500/15 text-indigo-200' : 'border-white/8 bg-white/[0.02] text-gray-400 hover:bg-white/5'}`}>
                                        {t.icon} {t.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="glass-panel p-5">
                            <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm"><Sparkles size={16} className="text-amber-400" /> Difficulty</h3>
                            <div className="space-y-2">
                                {['Easy', 'Medium', 'Hard'].map(d => (
                                    <label key={d} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${difficulty === d ? 'border-purple-500 bg-purple-500/10' : 'border-white/8 bg-white/[0.02] hover:bg-white/5'}`}>
                                        <input type="radio" name="difficulty" checked={difficulty === d} onChange={() => setDifficulty(d)} className="accent-purple-500" />
                                        <span className={`font-medium text-sm ${difficulty === d ? 'text-white' : 'text-gray-400'}`}>{d}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button onClick={startInterviewSession}
                            className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 transition-all shadow-[0_4px_24px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_32px_rgba(99,102,241,0.55)] transform hover:-translate-y-0.5 text-white">
                            <Play size={18} fill="currentColor" /> Start Interview
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResumeSetup;
