import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gamificationApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import BottomNav from '../components/BottomNav';

const RANK_EMOJI: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gamificationApi.leaderboard()
      .then(data => setEntries(data?.entries ?? data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button onClick={() => navigate('/dashboard')} style={s.back}>←</button>
        <h2 style={s.title}>🏆 Weekly Leaderboard</h2>
      </div>

      {loading ? (
        <div style={s.empty}>Loading...</div>
      ) : entries.length === 0 ? (
        <div style={s.empty}>No rankings yet this week.</div>
      ) : (
        <div style={s.list}>
          {entries.map((entry: any, i: number) => {
            const rank = i + 1;
            const isMe = entry.userId === user?.id || entry.user_id === user?.id;
            return (
              <div key={entry.userId ?? i} style={{ ...s.row, ...(isMe ? s.rowMe : {}) }}>
                <span style={s.rank}>{RANK_EMOJI[rank] ?? rank}</span>
                <img src={entry.avatarUrl || '/avatar-default.png'} alt="" style={s.avatar} />
                <span style={s.name}>{isMe ? 'You' : (entry.displayName ?? entry.name ?? 'User')}</span>
                <span style={s.xp}>{entry.weeklyXp ?? entry.xp ?? 0} XP</span>
              </div>
            );
          })}
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
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  row: { display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 12, padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  rowMe: { border: '2px solid #FF6B35', background: '#fff8f5' },
  rank: { fontSize: 20, minWidth: 32, textAlign: 'center' },
  avatar: { width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' },
  name: { flex: 1, fontWeight: 600, fontSize: 15 },
  xp: { fontWeight: 700, color: '#FF6B35', fontSize: 14 },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 60, fontSize: 15 },
};
