import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Code, Mic, ShieldAlert } from 'lucide-react';
import './Home.css';

const Home: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <div className="hero-section">
                <h1 className="hero-title">
                    Master the Technical Interview with <br />
                    <span className="gradient-text">AI Precision</span>
                </h1>
                <p className="hero-subtitle">
                    Experience real-world coding interviews with intelligent voice AI,
                    automated code evaluation, and personalized reasoning feedback based on your resume.
                </p>

                <div className="hero-actions">
                    <button className="primary-btn hero-btn" onClick={() => navigate('/setup')}>
                        <Play size={20} fill="currentColor" />
                        Start Simulation
                    </button>
                    <button className="secondary-btn hero-btn" onClick={() => navigate('/dashboard')}>
                        View Analytics
                    </button>
                </div>
            </div>

            <div className="features-grid">
                <div className="feature-card glass-panel">
                    <div className="feature-icon border-blue">
                        <Mic size={24} className="text-blue" />
                    </div>
                    <h3>Conversational AI</h3>
                    <p>Real-time voice interaction that challenges your logical thinking and problem-solving approach.</p>
                </div>

                <div className="feature-card glass-panel">
                    <div className="feature-icon border-purple">
                        <Code size={24} className="text-purple" />
                    </div>
                    <h3>Integrated IDE</h3>
                    <p>Full-featured code editor with real-time execution and syntax analysis.</p>
                </div>

                <div className="feature-card glass-panel">
                    <div className="feature-icon border-orange">
                        <ShieldAlert size={24} className="text-orange" />
                    </div>
                    <h3>Proctored Environment</h3>
                    <p>Strict browser locking prevents tab switching to simulate true interview pressure.</p>
                </div>
            </div>
        </div>
    );
};

export default Home;
