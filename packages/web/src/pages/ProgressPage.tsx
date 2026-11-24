import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { progressApi, gamificationApi } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function ProgressPage() {
  const navigate = useNavigate();
  const { xp } = useAuthStore();
  const [dashboard, setDashboard] = useState<any>(null);
  const [streak, setStreak] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      progressApi.dashboard(),
      gamificationApi.streak(),
      gamificationApi.badges(),
    ]).then(([dash, str, bdg]) => {
      setDashboard(dash);
      setStreak(str);
      setBadges((bdg as any).badges || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={s.loading}>Loading...</div>;

  const earned = badges.filter(b => b.earned);
  const locked = badges.filter(b => !b.earned);

  // Build 30-day calendar: true = active day
  const today = new Date();
  const calDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    const dayStr = d.toISOString().slice(0, 10);
    const active = streak?.activityDates?.includes(dayStr) ?? false;
    return { date: d.getDate(), active };
  });

  const skills = [
    { label: 'Speaking', icon: '🎤', value: `${dashboard?.speakingAvgScore ?? 0}%`, sub: 'avg accuracy' },
    { label: 'Writing', icon: '✍️', value: `${dashboard?.charactersMastered ?? 0}`, sub: 'chars mastered' },
    { label: 'Reading', icon: '📖', value: `${dashboard?.avgWpm ?? 0} WPM`, sub: 'avg speed' },
    { label: 'Comprehension', icon: '🧠', value: `${dashboard?.comprehensionAvg ?? 0}%`, sub: 'avg score' },
  ];

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/dashboard')}>← Back</button>
        <h2 style={s.title}>My Progress</h2>
      </div>

      {/* Overview */}
      <div style={s.overviewCard}>
        <div style={s.overviewRow}>
          <div style={s.overviewStat}>
            <span style={s.overviewVal}>{xp?.totalXp ?? 0}</span>
            <span style={s.overviewLabel}>Total XP</span>
          </div>
          <div style={s.overviewDivider} />
          <div style={s.overviewStat}>
            <span style={s.overviewVal}>Lv {xp?.level ?? 1}</span>
            <span style={s.overviewLabel}>{xp?.levelTitle ?? 'Beginner'}</span>
          </div>
          <div style={s.overviewDivider} />
          <div style={s.overviewStat}>
            <span style={s.overviewVal}>{dashboard?.lessonsCompleted ?? 0}</span>
            <span style={s.overviewLabel}>Lessons</span>
          </div>
        </div>
        <div style={s.streakRow}>
          <span style={s.streakFire}>🔥</span>
          <span style={s.streakVal}>{streak?.currentStreak ?? 0} day streak</span>
          <span style={s.streakBest}>Best: {streak?.longestStreak ?? 0}</span>
        </div>
      </div>

      {/* Skill Breakdown */}
      <p style={s.sectionLabel}>Skill Breakdown</p>
      <div style={s.skillGrid}>
        {skills.map(sk => (
          <div key={sk.label} style={s.skillCard}>
            <span style={s.skillIcon}>{sk.icon}</span>
            <span style={s.skillVal}>{sk.value}</span>
            <span style={s.skillLabel}>{sk.label}</span>
            <span style={s.skillSub}>{sk.sub}</span>
          </div>
        ))}
      </div>

      {/* 30-Day Streak Calendar */}
      <p style={s.sectionLabel}>30-Day Activity</p>
      <div style={s.calCard}>
        <div style={s.calGrid}>
          {calDays.map((d, i) => (
            <div key={i} style={{ ...s.calDay, ...(d.active ? s.calDayActive : {}) }}>
              <span style={s.calDayNum}>{d.date}</span>
            </div>
          ))}
        </div>
        <div style={s.calLegend}>
          <span style={s.calDotActive} /> Active &nbsp;&nbsp;
          <span style={s.calDotInactive} /> Inactive
        </div>
      </div>

      {/* Badges */}
      <p style={s.sectionLabel}>Badges ({earned.length}/{badges.length})</p>
      <div style={s.badgeGrid}>
        {earned.map(b => (
          <div key={b.id} style={s.badgeCard}>
            <span style={s.badgeIcon}>{b.icon ?? '🏅'}</span>
            <span style={s.badgeName}>{b.name}</span>
          </div>
        ))}
        {locked.map(b => (
          <div key={b.id} style={{ ...s.badgeCard, ...s.badgeLocked }}>
            <span style={s.badgeIcon}>🔒</span>
            <span style={s.badgeName}>{b.name}</span>
            {b.progress !== undefined && (
              <div style={s.badgeProgressBg}>
                <div style={{ ...s.badgeProgressFill, width: `${Math.min(100, b.progress)}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      {dashboard?.nextLesson && (
        <div style={s.ctaCard} onClick={() => navigate(`/lessons/${dashboard.nextLesson.id}`)}>
          <div>
            <p style={s.ctaLabel}>Continue Learning</p>
            <p style={s.ctaTitle}>{dashboard.nextLesson.title}</p>
          </div>
          <span style={s.ctaArrow}>→</span>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 480, margin: '0 auto', padding: '24px 16px 40px', fontFamily: 'system-ui, sans-serif', background: '#f8f9fa', minHeight: '100vh' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 18, color: '#666' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  back: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#FF6B35', fontWeight: 600, padding: 0 },
  title: { flex: 1, fontSize: 20, fontWeight: 700, margin: 0, color: '#1a1a2e' },
  overviewCard: { background: '#fff', borderRadius: 20, padding: '20px', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  overviewRow: { display: 'flex', alignItems: 'center', marginBottom: 16 },
  overviewStat: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  overviewVal: { fontSize: 24, fontWeight: 800, color: '#1a1a2e' },
  overviewLabel: { fontSize: 11, color: '#888', fontWeight: 500 },
  overviewDivider: { width: 1, height: 40, background: '#f0f0f0' },
  streakRow: { display: 'flex', alignItems: 'center', gap: 8, background: '#fff8f0', borderRadius: 12, padding: '10px 14px' },
  streakFire: { fontSize: 20 },
  streakVal: { flex: 1, fontSize: 15, fontWeight: 700, color: '#FF6B35' },
  streakBest: { fontSize: 12, color: '#888' },
  sectionLabel: { fontSize: 13, fontWeight: 700, color: '#888', textTransform: 'uppercase', margin: '0 0 12px', letterSpacing: 0.5 },
  skillGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 },
  skillCard: { background: '#fff', borderRadius: 16, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  skillIcon: { fontSize: 24, marginBottom: 4 },
  skillVal: { fontSize: 22, fontWeight: 800, color: '#1a1a2e' },
  skillLabel: { fontSize: 13, fontWeight: 600, color: '#444' },
  skillSub: { fontSize: 11, color: '#aaa' },
  calCard: { background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  calGrid: { display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4, marginBottom: 10 },
  calDay: { aspectRatio: '1', borderRadius: 6, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  calDayActive: { background: '#FF6B35' },
  calDayNum: { fontSize: 9, color: '#fff', fontWeight: 600 },
  calLegend: { display: 'flex', alignItems: 'center', fontSize: 11, color: '#888' },
  calDotActive: { display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: '#FF6B35', marginRight: 4 },
  calDotInactive: { display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: '#f0f0f0', marginRight: 4 },
  badgeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 },
  badgeCard: { background: '#fff', borderRadius: 16, padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  badgeLocked: { opacity: 0.5 },
  badgeIcon: { fontSize: 28 },
  badgeName: { fontSize: 11, fontWeight: 600, color: '#444', textAlign: 'center' },
  badgeProgressBg: { width: '100%', height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden', marginTop: 4 },
  badgeProgressFill: { height: '100%', background: '#FF6B35', borderRadius: 2 },
  ctaCard: { background: '#fff', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', cursor: 'pointer', border: '2px solid #FF6B35', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  ctaLabel: { fontSize: 11, color: '#FF6B35', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' },
  ctaTitle: { fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: 0 },
  ctaArrow: { fontSize: 24, color: '#FF6B35', marginLeft: 'auto' },
};
