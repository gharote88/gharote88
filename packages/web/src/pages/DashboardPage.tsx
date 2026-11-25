import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { progressApi, gamificationApi, funFactsApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import BottomNav from '../components/BottomNav';
import { CardSkeleton, StatGridSkeleton } from '../components/Skeleton';

export default function DashboardPage() {
  const { user, xp, refreshXp } = useAuthStore();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<any>(null);
  const [streak, setStreak] = useState<any>(null);
  const [challenge, setChallenge] = useState<any>(null);
  const [fact, setFact] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      progressApi.dashboard(),
      gamificationApi.streak(),
      gamificationApi.dailyChallenge().catch(() => null),
      funFactsApi.today().catch(() => null),
      refreshXp(),
    ]).then(([dash, str, chal, f]) => {
      setDashboard(dash);
      setStreak(str);
      setChallenge(chal);
      setFact(f);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={{ flex: 1 }}>
          <div style={{ height: 24, width: 160, background: '#f0f0f0', borderRadius: 8, marginBottom: 8 }} />
          <div style={{ height: 14, width: 200, background: '#f0f0f0', borderRadius: 6 }} />
        </div>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f0f0f0' }} />
      </div>
      <CardSkeleton />
      <StatGridSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <BottomNav />
    </div>
  );

  const xpToNext = xp ? [100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000][xp.level - 1] ?? 5000 : 100;
  const xpProgress = xp ? Math.min(100, (xp.totalXp / xpToNext) * 100) : 0;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.greeting}>नमस्कार, {user?.name?.split(' ')[0]}! 👋</h2>
          <p style={styles.subGreeting}>Ready to learn Marathi today?</p>
        </div>
        <img src={user?.avatarUrl || '/avatar-default.png'} alt="avatar" style={styles.avatar} />
      </div>

      {/* XP Bar */}
      <div style={styles.xpCard}>
        <div style={styles.xpRow}>
          <span style={styles.levelBadge}>Level {xp?.level ?? 1}</span>
          <span style={styles.levelTitle}>{xp?.levelTitle ?? 'Beginner'}</span>
          <span style={styles.xpText}>{xp?.totalXp ?? 0} XP</span>
        </div>
        <div style={styles.xpBarBg}>
          <div style={{ ...styles.xpBarFill, width: `${xpProgress}%` }} />
        </div>
      </div>

      {/* Stats Row */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>🔥</span>
          <span style={styles.statValue}>{streak?.currentStreak ?? 0}</span>
          <span style={styles.statLabel}>Day Streak</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>📚</span>
          <span style={styles.statValue}>{dashboard?.lessonsCompleted ?? 0}</span>
          <span style={styles.statLabel}>Lessons Done</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>✍️</span>
          <span style={styles.statValue}>{dashboard?.charactersMastered ?? 0}</span>
          <span style={styles.statLabel}>Characters</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>📖</span>
          <span style={styles.statValue}>{dashboard?.avgWpm ?? 0}</span>
          <span style={styles.statLabel}>Avg WPM</span>
        </div>
      </div>

      {/* Daily Challenge */}
      {challenge && !challenge.completed && (
        <div style={{ ...styles.challengeCard, cursor: 'pointer' }} onClick={() => navigate('/challenge')}>
          <div style={styles.challengeHeader}>
            <span style={styles.challengeIcon}>⚡</span>
            <span style={styles.challengeTitle}>Daily Challenge</span>
            <span style={styles.challengeXp}>+{challenge.xpReward} XP</span>
          </div>
          <p style={styles.challengeDesc}>{challenge.title}</p>
          <p style={styles.challengeSubDesc}>{challenge.description}</p>
        </div>
      )}

      {/* Next Lesson CTA */}
      {dashboard?.nextLesson && (
        <div style={styles.nextLesson} onClick={() => navigate(`/lessons/${dashboard.nextLesson.id}`)}>
          <div>
            <p style={styles.nextLabel}>Continue Learning</p>
            <h3 style={styles.nextTitle}>{dashboard.nextLesson.title}</h3>
            <p style={styles.nextMeta}>{dashboard.nextLesson.level} · {dashboard.nextLesson.estimatedMinutes} min</p>
          </div>
          <span style={styles.nextArrow}>→</span>
        </div>
      )}

      {/* Fact of the Day */}
      {fact && (
        <div style={styles.factCard}>
          <p style={styles.factLabel}>💡 Did You Know?</p>
          <p style={styles.factMarathi}>{fact.contentMarathi}</p>
          <p style={styles.factEnglish}>{fact.contentEnglish}</p>
        </div>
      )}

      {/* Leaderboard link */}
      <div style={styles.leaderboardLink} onClick={() => navigate('/leaderboard')}>
        <span>🏆 Weekly Leaderboard</span>
        <span>→</span>
      </div>

      {/* Quick links row */}
      <div style={styles.quickLinks}>
        {[
          { icon: '🗺️', label: 'Journey', path: '/journey' },
          { icon: '🎮', label: 'Mini Games', path: '/mini-games' },
          { icon: '📖', label: 'Reading', path: '/reading' },
          { icon: '📊', label: 'Progress', path: '/progress' },
        ].map(({ icon, label, path }) => (
          <div key={path} style={styles.quickLink} onClick={() => navigate(path)}>
            <span style={styles.quickLinkIcon}>{icon}</span>
            <span style={styles.quickLinkLabel}>{label}</span>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 480, margin: '0 auto', padding: '24px 16px 100px', fontFamily: 'system-ui, sans-serif', background: '#f8f9fa', minHeight: '100vh' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 18, color: '#666' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: 700, margin: 0, color: '#1a1a2e' },
  subGreeting: { color: '#666', margin: '4px 0 0', fontSize: 14 },
  avatar: { width: 48, height: 48, borderRadius: '50%', border: '3px solid #FF6B35' },
  xpCard: { background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  xpRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  levelBadge: { background: '#FF6B35', color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 },
  levelTitle: { flex: 1, fontWeight: 600, color: '#333', fontSize: 14 },
  xpText: { color: '#FF6B35', fontWeight: 700, fontSize: 14 },
  xpBarBg: { height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  xpBarFill: { height: '100%', background: 'linear-gradient(90deg, #FF6B35, #F7931E)', borderRadius: 4, transition: 'width 0.5s ease' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 },
  statCard: { background: '#fff', borderRadius: 12, padding: '12px 8px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 2 },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 20, fontWeight: 800, color: '#1a1a2e' },
  statLabel: { fontSize: 10, color: '#888', fontWeight: 500 },
  challengeCard: { background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 16, padding: '16px 20px', marginBottom: 16, color: '#fff' },
  challengeHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  challengeIcon: { fontSize: 20 },
  challengeTitle: { flex: 1, fontWeight: 700, fontSize: 14 },
  challengeXp: { background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 },
  challengeDesc: { fontWeight: 700, fontSize: 16, margin: '0 0 4px' },
  challengeSubDesc: { fontSize: 13, opacity: 0.85, margin: 0 },
  nextLesson: { background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', cursor: 'pointer', border: '2px solid #FF6B35' },
  nextLabel: { fontSize: 11, color: '#FF6B35', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' },
  nextTitle: { fontSize: 18, fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' },
  nextMeta: { fontSize: 12, color: '#888', margin: 0, textTransform: 'capitalize' },
  nextArrow: { fontSize: 24, color: '#FF6B35', marginLeft: 'auto' },
  factCard: { background: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  factLabel: { fontSize: 12, fontWeight: 700, color: '#F7931E', margin: '0 0 8px' },
  factMarathi: { fontSize: 18, fontWeight: 600, color: '#1a1a2e', margin: '0 0 6px', lineHeight: 1.5, fontFamily: 'var(--font-devanagari)' },
  factEnglish: { fontSize: 13, color: '#666', margin: 0, lineHeight: 1.5 },
  leaderboardLink: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: 12, padding: '14px 16px', marginTop: 12, cursor: 'pointer', fontWeight: 600, fontSize: 15, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  quickLinks: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 },
  quickLink: { background: '#fff', borderRadius: 12, padding: '12px 4px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 4 },
  quickLinkIcon: { fontSize: 22 },
  quickLinkLabel: { fontSize: 10, color: '#666', fontWeight: 600 },
