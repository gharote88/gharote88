import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gamificationApi } from '../api/client';
import BottomNav from '../components/BottomNav';

const TYPE_ROUTE: Record<string, string> = {
  speaking: '/speaking',
  writing: '/writing',
  reading: '/reading',
};

export default function ChallengePage() {
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    gamificationApi.dailyChallenge()
      .then(data => setChallenge(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleStart() {
    if (!challenge) return;
    const route = TYPE_ROUTE[challenge.type] ?? '/writing';
    // Mark complete optimistically then navigate
    setCompleting(true);
    try {
      await gamificationApi.completeChallenge(challenge.id, 100);
      setDone(true);
    } catch {
      // non-fatal — still navigate
    } finally {
      setCompleting(false);
    }
    navigate(route);
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button onClick={() => navigate('/dashboard')} style={s.back}>←</button>
        <h2 style={s.title}>⚡ Daily Challenge</h2>
      </div>

      {loading ? (
        <div style={s.empty}>Loading...</div>
      ) : !challenge ? (
        <div style={s.empty}>No challenge available today.</div>
      ) : (
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.type}>{challenge.type?.toUpperCase() ?? 'PRACTICE'}</span>
            <span style={s.xpBadge}>+{challenge.xpReward ?? challenge.xp_reward ?? 50} XP</span>
          </div>
          <h3 style={s.challengeTitle}>{challenge.title}</h3>
          <p style={s.desc}>{challenge.description}</p>

          {done || challenge.completed ? (
            <div style={s.completedBadge}>✅ Completed today!</div>
          ) : (
            <button style={s.startBtn} onClick={handleStart} disabled={completing}>
              {completing ? 'Starting…' : 'Start Challenge'}
            </button>
          )}
        </div>
      )}
      <BottomNav />
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 480, margin: '0 auto', padding: '16px 16px 80px', minHeight: '100vh', background: '#fafafa' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  back: { background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', padding: 4 },
  title: { margin: 0, fontSize: 20, fontWeight: 700 },
  card: { background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: 20, padding: '24px 20px', color: '#fff' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  type: { fontSize: 11, fontWeight: 700, letterSpacing: 1, opacity: 0.8 },
  xpBadge: { background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 700 },
  challengeTitle: { margin: '0 0 8px', fontSize: 22, fontWeight: 800 },
  desc: { margin: '0 0 24px', fontSize: 14, opacity: 0.9, lineHeight: 1.5 },
  startBtn: { width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#fff', color: '#764ba2', fontWeight: 800, fontSize: 16, cursor: 'pointer' },
  completedBadge: { textAlign: 'center', fontSize: 16, fontWeight: 700, padding: '12px', background: 'rgba(255,255,255,0.15)', borderRadius: 12 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 60, fontSize: 15 },
};
