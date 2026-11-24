import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
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
import OfflineBanner from './components/OfflineBanner';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore();
  const location = useLocation();

  if (!initialized) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 18, color: '#666' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

export default function App() {
  const { init } = useAuthStore();
  useEffect(() => init(), []);

  return (
    <BrowserRouter>
      <OfflineBanner />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
