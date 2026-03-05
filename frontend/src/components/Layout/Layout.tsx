import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, FileText, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const Layout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const navItems = [
        { name: 'Home', path: '/', icon: <Home size={20} /> },
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'New Interview', path: '/setup', icon: <FileText size={20} /> },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Get initials for avatar
    const initials = user?.fullName
        ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        : '?';

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className="sidebar glass-panel">
                <div className="sidebar-header">
                    <div className="logo">
                        <div className="logo-orb"></div>
                        <span className="logo-text gradient-text">SimulPrep</span>
                    </div>
                </div>

                {/* User profile section */}
                {user && (
                    <div className="px-4 py-3 mx-2 mb-3 rounded-xl bg-white/5 border border-white/8">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-200 truncate">{user.fullName}</p>
                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                        </div>
                    </div>
                )}

                <nav className="sidebar-nav">
                    <ul>
                        {navItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}>
                                    {item.icon}
                                    <span>{item.name}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <button className="nav-link" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
                        <User size={20} />
                        <span>Profile</span>
                    </button>
                    <button className="nav-link logout" onClick={handleLogout} style={{ cursor: 'pointer' }}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
