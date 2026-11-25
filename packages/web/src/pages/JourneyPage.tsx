import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { journeyApi, gamificationApi } from '../api/client';

type Checkpoint = {
  id: string; name: string; marathiName?: string; description?: string;
  xpRequired: number; status: 'completed' | 'current' | 'locked';
};

type Route = {
  id: string; startCity: string; targetCity: string;
  totalDistance: number; checkpoints: Checkpoint[];
};

type Journey = {
  currentCheckpointIndex: number; totalXpEarned: number;
  progressPercentage: number; completedCheckpoints: string[];
};

export default function JourneyPage() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<any[]>([]);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [hasJourney, setHasJourney] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    Promise.all([journeyApi.get(), journeyApi.routes()]).then(([j, r]) => {
      setHasJourney(j.hasJourney);
      if (j.hasJourney) {
        setJourney(j.journey);
        setRoute(j.route);
      }
      setRoutes(r.routes ?? []);
    }).finally(() => setLoading(false));
  }, []);

  async function startJourney(routeId: string) {
    setStarting(true);
    try {
      await journeyApi.start(routeId);
      const j = await journeyApi.get();
      setHasJourney(j.hasJourney);
      setJourney(j.journey);
      setRoute(j.route);
    } finally {
      setStarting(false);
    }
  }

  if (loading) return <div style={s.loading}>Loading journey...</div>;

  // ── Route selection ──────────────────────────────────────────────────────────
  if (!hasJourney) return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/dashboard')}>← Back</button>
        <h2 style={s.title}>Journey Map</h2>
      </div>
      <p style={s.subtitle}>Choose your starting city and travel to Pune!</p>
      {routes.map(r => (
        <div key={r.id} style={s.routeCard}>
          <div style={s.routeInfo}>
            <div style={s.routeCity}>{r.startCity} <span style={s.routeMarathi}>{r.marathiName}</span></div>
            <div style={s.routeMeta}>{r.distanceToPune} km · {r.checkpointCount} checkpoints · {r.totalXpRequired} XP needed</div>
            <div style={s.routeDesc}>{r.description}</div>
          </div>
          <button
            style={s.startBtn}
            onClick={() => startJourney(r.id)}
            disabled={starting}
          >
            {starting ? '...' : 'Start →'}
          </button>
        </div>
      ))}
    </div>
  );

  // ── Active journey ───────────────────────────────────────────────────────────
  const checkpoints: Checkpoint[] = route?.checkpoints ?? [];
  const pct = journey?.progressPercentage ?? 0;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/dashboard')}>← Back</button>
        <h2 style={s.title}>Journey Map</h2>
      </div>

      {/* Route banner */}
      <div style={s.routeBanner}>
        <span style={s.routeFrom}>{route?.startCity}</span>
        <div style={s.routeArrowWrap}>
          <div style={s.routeTrack}>
            <div style={{ ...s.routeTrackFill, width: `${pct}%` }} />
            <div style={{ ...s.routeMarker, left: `${pct}%` }}>🚶</div>
          </div>
        </div>
        <span style={s.routeTo}>Pune 🏙️</span>
      </div>

      {/* XP progress */}
      <div style={s.xpCard}>
        <span style={s.xpLabel}>Journey XP</span>
        <span style={s.xpVal}>{journey?.totalXpEarned ?? 0} XP</span>
        <span style={s.xpPct}>{Math.round(pct)}% to Pune</span>
      </div>

      {/* Checkpoints */}
      <p style={s.sectionLabel}>Checkpoints</p>
      {checkpoints.map((cp, i) => {
        const isDone = cp.status === 'completed';
        const isCurrent = cp.status === 'current';
        return (
          <div key={cp.id} style={{ ...s.cpCard, ...(isCurrent ? s.cpCurrent : isDone ? s.cpDone : s.cpLocked) }}>
            <div style={s.cpIndex}>{isDone ? '✅' : isCurrent ? '📍' : '🔒'}</div>
            <div style={s.cpInfo}>
              <div style={s.cpName}>{cp.name} {cp.marathiName && <span style={s.cpMarathi}>{cp.marathiName}</span>}</div>
              {cp.description && <div style={s.cpDesc}>{cp.description}</div>}
              <div style={s.cpXp}>{cp.xpRequired} XP required</div>
            </div>
            {isCurrent && (
              <button style={s.practiceBtn} onClick={() => navigate('/lessons')}>
                Practice →
              </button>
            )}
          </div>
        );
      })}

      {/* Earn XP CTA */}
      <div style={s.ctaCard}>
        <p style={s.ctaText}>Complete lessons and practice to earn XP and advance your journey!</p>
        <div style={s.ctaBtns}>
          <button style={s.ctaBtn} onClick={() => navigate('/lessons')}>📚 Lessons</button>
          <button style={s.ctaBtn} onClick={() => navigate('/speaking')}>🎤 Speaking</button>
          <button style={s.ctaBtn} onClick={() => navigate('/writing')}>✍️ Writing</button>
        </div>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 480, margin: '0 auto', padding: '24px 16px 40px', fontFamily: 'system-ui, sans-serif', background: '#f8f9fa', minHeight: '100vh' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 18, color: '#666' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 },
  back: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#FF6B35', fontWeight: 600, padding: 0 },
  title: { flex: 1, fontSize: 20, fontWeight: 700, margin: 0, color: '#1a1a2e' },
  subtitle: { fontSize: 14, color: '#888', margin: '0 0 20px' },
  routeCard: { background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 },
  routeInfo: { flex: 1 },
  routeCity: { fontSize: 17, fontWeight: 700, color: '#1a1a2e', marginBottom: 2 },
  routeMarathi: { fontSize: 15, color: '#FF6B35', fontWeight: 600 },
  routeMeta: { fontSize: 12, color: '#888', marginBottom: 4 },
  routeDesc: { fontSize: 13, color: '#555', lineHeight: 1.4 },
  startBtn: { background: '#FF6B35', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0 },
  routeBanner: { background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 10 },
  routeFrom: { fontSize: 13, fontWeight: 700, color: '#555', flexShrink: 0 },
  routeTo: { fontSize: 13, fontWeight: 700, color: '#FF6B35', flexShrink: 0 },
  routeArrowWrap: { flex: 1, position: 'relative', height: 32, display: 'flex', alignItems: 'center' },
  routeTrack: { position: 'relative', width: '100%', height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'visible' },
  routeTrackFill: { height: '100%', background: 'linear-gradient(90deg, #FF6B35, #F7931E)', borderRadius: 3, transition: 'width 0.5s ease' },
  routeMarker: { position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', fontSize: 20, transition: 'left 0.5s ease' },
  xpCard: { background: 'linear-gradient(135deg, #FF6B35, #F7931E)', borderRadius: 16, padding: '14px 20px', marginBottom: 16, color: '#fff', display: 'flex', alignItems: 'center', gap: 12 },
  xpLabel: { fontSize: 13, opacity: 0.85 },
  xpVal: { flex: 1, fontSize: 22, fontWeight: 800 },
  xpPct: { fontSize: 13, opacity: 0.85 },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', margin: '0 0 10px', letterSpacing: 0.5 },
  cpCard: { borderRadius: 14, padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 },
  cpDone: { background: '#f0fdf4', border: '1px solid #bbf7d0' },
  cpCurrent: { background: '#fff', border: '2px solid #FF6B35', boxShadow: '0 2px 8px rgba(255,107,53,0.15)' },
  cpLocked: { background: '#f8f9fa', border: '1px solid #e5e7eb', opacity: 0.6 },
  cpIndex: { fontSize: 24, flexShrink: 0 },
  cpInfo: { flex: 1 },
  cpName: { fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 2 },
  cpMarathi: { fontSize: 13, color: '#FF6B35', fontWeight: 600, marginLeft: 6 },
  cpDesc: { fontSize: 12, color: '#666', marginBottom: 4, lineHeight: 1.4 },
  cpXp: { fontSize: 11, color: '#888', fontWeight: 600 },
  practiceBtn: { background: '#FF6B35', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 },
  ctaCard: { background: '#fff', borderRadius: 16, padding: '16px 20px', marginTop: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  ctaText: { fontSize: 13, color: '#666', margin: '0 0 12px', lineHeight: 1.5 },
  ctaBtns: { display: 'flex', gap: 8 },
  ctaBtn: { flex: 1, background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 6px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#333' },
};
