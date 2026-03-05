import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Brain, Eye, EyeOff, Loader2, Mail, Lock, User, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:8080/api/auth';

const perks = [
    'AI-powered resume analysis',
    'Personalised interview questions',
    'Real-time cross-questioning',
    'Technical + communication scoring',
    'Downloadable PDF report',
];

const Register: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirm) { setError('Passwords do not match'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

        setLoading(true);
        try {
            const res = await fetch(`${API}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, password, phone }),
            });
            const data = await res.json();
            if (data.success) {
                login({ userId: data.userId, fullName: data.fullName, email: data.email });
                navigate('/dashboard');
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch {
            setError('Cannot connect to server. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-4xl relative z-10 flex gap-10 items-center">
                {/* Left: Perks panel */}
                <div className="hidden lg:flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Brain size={24} className="text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-100">AI Interview</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-100 mb-3">Your AI interview coach</h2>
                    <p className="text-gray-400 mb-8">Practice like it's the real thing. Get scored, get better.</p>
                    <div className="space-y-4">
                        {perks.map(p => (
                            <div key={p} className="flex items-center gap-3">
                                <CheckCircle2 size={20} className="text-indigo-400 shrink-0" />
                                <span className="text-gray-300 text-sm">{p}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Form */}
                <div className="w-full max-w-md">
                    <div className="text-center mb-6 lg:text-left">
                        <h1 className="text-2xl font-bold text-gray-100">Create your account</h1>
                        <p className="text-gray-400 mt-1 text-sm">Free forever. No credit card required.</p>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-7 shadow-2xl">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                                        placeholder="Aditya Sharma"
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-colors text-sm" />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-colors text-sm" />
                                </div>
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone <span className="text-gray-600">(optional)</span></label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                                        placeholder="+91 98765 43210"
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-colors text-sm" />
                                </div>
                            </div>

                            {/* Password + Confirm in a row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input type={showPw ? 'text' : 'password'} required value={password}
                                            onChange={e => setPassword(e.target.value)} placeholder="Min 6 chars"
                                            className="w-full pl-10 pr-9 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm transition-colors" />
                                        <button type="button" onClick={() => setShowPw(!showPw)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                                            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirm</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input type={showPw ? 'text' : 'password'} required value={confirm}
                                            onChange={e => setConfirm(e.target.value)} placeholder="Repeat"
                                            className={`w-full pl-10 pr-4 py-2.5 bg-gray-800 border rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none text-sm transition-colors ${confirm && confirm !== password ? 'border-red-500' : 'border-gray-700 focus:border-indigo-500'
                                                }`} />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={loading}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20">
                                {loading ? <><Loader2 size={18} className="animate-spin" /> Creating account…</> : <>Create Account <ArrowRight size={18} /></>}
                            </button>
                        </form>

                        <div className="mt-5 text-center text-sm text-gray-400">
                            Already have an account?{' '}
                            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Sign in</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
