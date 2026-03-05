import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ResumeSetup from './pages/ResumeSetup';
import InterviewRoom from './pages/InterviewRoom';
import Report from './pages/Report';
import Login from './pages/Login';
import Register from './pages/Register';

// Protected route — redirect to /login if not logged in
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
};

function AppRoutes() {
  const { isLoggedIn } = useAuth();
  return (
    <Routes>
      {/* Auth pages (no layout) */}
      <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Register />} />

      {/* App pages (with sidebar layout) */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="setup" element={<ResumeSetup />} />
        <Route path="report/:id" element={<Report />} />
      </Route>

      {/* Interview room (fullscreen, no layout) */}
      <Route path="/interview/:id" element={<PrivateRoute><InterviewRoom /></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
