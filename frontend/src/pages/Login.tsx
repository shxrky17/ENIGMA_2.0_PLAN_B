import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Brain, Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:8080/api/auth';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (data.success) {
                login({ userId: data.userId, fullName: data.fullName, email: data.email });
                navigate('/dashboard');
            } else {
                setError(data.message || 'Login failed');
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
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
                <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(99,102,241,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.14) 1px, transparent 1px)',
                        backgroundSize: '34px 34px',
                    }}
                />
            </div>

            <div className="w-full max-w-4xl relative z-10">
                <div className="grid md:grid-cols-2 gap-0 bg-gray-900/95 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-indigo-600/20 via-indigo-500/10 to-cyan-500/20 border-r border-white/10">
                        <div>
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 mb-6 shadow-xl shadow-indigo-500/30">
                                <Brain size={28} className="text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-100 leading-tight">AI Interview Platform</h1>
                            <p className="text-gray-300/80 mt-3 text-sm">
                                Resume-personalized interviews with live coding practice and AI feedback.
                            </p>
                        </div>
                        <div className="space-y-2 text-xs text-gray-300/80">
                            <p>• Voice-based interview flow</p>
                            <p>• LeetCode-style coding workspace</p>
                            <p>• Automated scoring and report</p>
                        </div>
                    </div>

                    <div className="p-8 md:p-10">
                        <div className="md:hidden text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 mb-4 shadow-xl shadow-indigo-500/30">
                                <Brain size={32} className="text-white" />
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold text-gray-100">Welcome back</h2>
                        <p className="text-gray-400 mt-2 mb-8">Sign in to continue your interview sessions</p>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
                                <div className="relative">
                                    <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full pl-11 pr-4 py-3.5 bg-gray-800/90 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                                <div className="relative">
                                    <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type={showPw ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Your password"
                                        className="w-full pl-11 pr-12 py-3.5 bg-gray-800/90 border border-gray-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(!showPw)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                    >
                                        {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 disabled:opacity-60 text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/35 hover:shadow-indigo-500/45"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" /> Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign in <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center text-sm text-gray-400">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-indigo-300 hover:text-cyan-300 font-medium transition-colors">
                                Create one free
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

