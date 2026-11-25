import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import ErrorBoundary from './components/ErrorBoundary';
import PWAUpdateBanner from './components/PWAUpdateBanner';
import OfflineBanner from './components/OfflineBanner';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LessonsPage from './pages/LessonsPage';
import LessonDetailPage from './pages/LessonDetailPage';
import WritingPage from './pages/WritingPage';
import SpeakingPage from './pages/SpeakingPage';
import ReadingPage from './pages/ReadingPage';
import FunFactsPage from './pages/FunFactsPage';
import ProgressPage from './pages/ProgressPage';
import AvatarPage from './pages/AvatarPage';
import StoryPage from './pages/StoryPage';
import ParentDashboardPage from './pages/ParentDashboardPage';
import NotificationPreferencesPage from './pages/NotificationPreferencesPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ChallengePage from './pages/ChallengePage';
import JourneyPage from './pages/JourneyPage';
import MiniGamesPage from './pages/MiniGamesPage';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore();
  const location = useLocation();

  if (!initialized) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 18, color: '#666' }}>
      Loading...
    </div>
  );
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

// Waits for Supabase to process the OAuth token before redirecting
function AuthCallback() {
  const { initialized, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!initialized) return;
    const redirect = sessionStorage.getItem('postReauthRedirect');
    if (redirect) {
      sessionStorage.removeItem('postReauthRedirect');
      navigate(user ? redirect : '/login', { replace: true });
    } else {
      navigate(user ? '/dashboard' : '/login', { replace: true });
    }
  }, [initialized, user]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 18, color: '#666' }}>
      Signing in...
    </div>
  );
}

function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui', gap: 16 }}>
      <div style={{ fontSize: 56 }}>🔍</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Page not found</h2>
      <button style={{ background: '#FF6B35', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
        Go to Dashboard
      </button>
    </div>
  );
}

export default function App() {
  const { init } = useAuthStore();
  useEffect(() => init(), []);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <OfflineBanner />
        <PWAUpdateBanner />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} />
          <Route path="/lessons" element={<AuthGuard><LessonsPage /></AuthGuard>} />
          <Route path="/lessons/:id" element={<AuthGuard><LessonDetailPage /></AuthGuard>} />
          <Route path="/writing" element={<AuthGuard><WritingPage /></AuthGuard>} />
          <Route path="/speaking" element={<AuthGuard><SpeakingPage /></AuthGuard>} />
          <Route path="/reading" element={<AuthGuard><ReadingPage /></AuthGuard>} />
          <Route path="/fun-facts" element={<AuthGuard><FunFactsPage /></AuthGuard>} />
          <Route path="/progress" element={<AuthGuard><ProgressPage /></AuthGuard>} />
          <Route path="/avatar" element={<AuthGuard><AvatarPage /></AuthGuard>} />
          <Route path="/story" element={<AuthGuard><StoryPage /></AuthGuard>} />
          <Route path="/parent" element={<AuthGuard><ParentDashboardPage /></AuthGuard>} />
          <Route path="/notifications" element={<AuthGuard><NotificationPreferencesPage /></AuthGuard>} />
          <Route path="/leaderboard" element={<AuthGuard><LeaderboardPage /></AuthGuard>} />
          <Route path="/challenge" element={<AuthGuard><ChallengePage /></AuthGuard>} />
          <Route path="/journey" element={<AuthGuard><JourneyPage /></AuthGuard>} />
          <Route path="/mini-games" element={<AuthGuard><MiniGamesPage /></AuthGuard>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
