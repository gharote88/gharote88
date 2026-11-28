import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { journeyApi } from '../api/client';
import BottomNav from '../components/BottomNav';
import { StarIcon, BuildingsIcon, BookOpenIcon, PencilSimpleIcon, MicrophoneIcon, MapPinIcon, XIcon } from '@phosphor-icons/react';

// ── 12-city curriculum ────────────────────────────────────────────────────────
const CITIES = [
  { id: 'mumbai',      name: 'Mumbai',      level: 1,  content: 'Vowels',            region: 'Konkan Coast',        x: 75,  y: 620 },
  { id: 'pune',        name: 'Pune',        level: 2,  content: 'Consonants',        region: 'Western Ghats',       x: 115, y: 545 },
  { id: 'nashik',      name: 'Nashik',      level: 3,  content: 'Numbers',           region: 'Godavari Valley',     x: 130, y: 440 },
  { id: 'ahmednagar',  name: 'Ahmednagar',  level: 4,  content: 'Basic Words',       region: 'Deccan Plateau',      x: 190, y: 490 },
  { id: 'shirdi',      name: 'Shirdi',      level: 5,  content: 'More Words',        region: 'North Deccan',        x: 175, y: 385 },
  { id: 'aurangabad',  name: 'Aurangabad',  level: 6,  content: 'Simple Sentences',  region: 'Marathwada',          x: 235, y: 355 },
  { id: 'latur',       name: 'Latur',       level: 7,  content: 'Daily Sentences',   region: 'South Marathwada',    x: 255, y: 490 },
  { id: 'solapur',     name: 'Solapur',     level: 8,  content: 'Short Paragraphs',  region: 'Eastern Deccan',      x: 200, y: 565 },
  { id: 'kolhapur',    name: 'Kolhapur',    level: 9,  content: 'Paragraphs',        region: 'Southern Maharashtra', x: 95, y: 620 },
  { id: 'satara',      name: 'Satara',      level: 10, content: "Children's Poems",  region: 'Sahyadri Hills',      x: 135, y: 590 },
  { id: 'ratnagiri',   name: 'Ratnagiri',   level: 11, content: 'Famous Poems',      region: 'Konkan South',        x: 58,  y: 545 },
  { id: 'nagpur',      name: 'Nagpur',      level: 12, content: 'Full Fluency',      region: 'Vidarbha',            x: 320, y: 295 },
];

// Path order connecting cities on the map
const PATH = [0,1,2,3,4,5,6,7,8,9,10,11]; // indices into CITIES

type CityState = 'done' | 'current' | 'next' | 'locked' | 'goal';

function getCityState(cityIndex: number, currentLevel: number): CityState {
  const level = CITIES[cityIndex].level;
  if (cityIndex === 11) return 'goal';
  if (level < currentLevel) return 'done';
  if (level === currentLevel) return 'current';
  if (level === currentLevel + 1) return 'next';
  return 'locked';
}

const STATE_COLORS: Record<CityState, string> = {
  done:    'var(--color-teal)',
  current: 'var(--color-saffron)',
  next:    'var(--color-gold)',
  locked:  'var(--color-border)',
  goal:    'var(--color-slate)',
};

const STATE_SIZES: Record<CityState, number> = {
  done: 18, current: 26, next: 20, locked: 14, goal: 28,
};

export default function JourneyPage() {
  const navigate = useNavigate();
  const [journey, setJourney] = useState<any>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [hasJourney, setHasJourney] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [selectedCity, setSelectedCity] = useState<number | null>(null);

  // Derive current level from journey data (fallback to 1)
  const currentLevel = journey?.currentCheckpointIndex != null
    ? journey.currentCheckpointIndex + 1
    : 1;

  useEffect(() => {
    Promise.all([journeyApi.get(), journeyApi.routes()])
      .then(([j, r]) => {
        setHasJourney(j.hasJourney);
        if (j.hasJourney) setJourney(j.journey);
        setRoutes(r.routes ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function startJourney(routeId: string) {
    setStarting(true);
    try {
      await journeyApi.start(routeId);
      const j = await journeyApi.get();
      setHasJourney(j.hasJourney);
      setJourney(j.journey);
    } finally {
      setStarting(false);
    }
  }

  if (loading) return (
    <div style={s.loadingPage}>
      <div style={s.loadingDot} />
      <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Loading your journey…</p>
    </div>
  );

  // ── Route selection (no journey started yet) ──────────────────────────────
  if (!hasJourney) return (
    <div style={s.page}>
      <h2 style={s.title}>Maharashtra Journey</h2>
      <p style={s.subtitle}>Choose your starting city to begin your journey to Nagpur</p>

      {(routes.length > 0 ? routes : [
        { id: 'default', startCity: 'Mumbai', marathiName: 'मुंबई', distanceToPune: 150, checkpointCount: 12, totalXpRequired: 5000, description: 'Start from the coast and travel across Maharashtra' },
      ]).map(r => (
        <div key={r.id} style={s.routeCard}>
          <div style={s.routeIconWrap}>
            <BuildingsIcon size={22} weight="duotone" color="var(--color-teal)" />
          </div>
          <div style={s.routeInfo}>
            <p style={s.routeCity}>{r.startCity} <span style={s.routeMarathi}>{r.marathiName}</span></p>
            <p style={s.routeMeta}>{r.checkpointCount ?? 12} cities · {r.totalXpRequired ?? 5000} XP total</p>
            <p style={s.routeDesc}>{r.description}</p>
          </div>
          <button style={s.startBtn} onClick={() => startJourney(r.id)} disabled={starting}>
            {starting ? '…' : 'Start →'}
          </button>
        </div>
      ))}
      <BottomNav />
    </div>
  );

  // ── Active journey — Maharashtra map ──────────────────────────────────────
  const currentCity = CITIES[currentLevel - 1] ?? CITIES[0];
  const pct = journey?.progressPercentage ?? Math.round(((currentLevel - 1) / 12) * 100);
  const selected = selectedCity !== null ? CITIES[selectedCity] : null;
  const selectedState = selectedCity !== null ? getCityState(selectedCity, currentLevel) : null;

  return (
    <div style={s.page}>

      {/* ── HEADER ── */}
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Maharashtra Journey</h2>
          <p style={s.headerMeta}>Level {currentLevel} · {currentCity.name}</p>
        </div>
        <div style={s.xpPill}>
          <StarIcon size={14} weight="fill" color="var(--color-teal)" />
          <span style={s.xpPillText}>{journey?.totalXpEarned ?? 0} XP</span>
        </div>
      </div>

      {/* ── MAP CONTAINER ── */}
      <div style={s.mapWrap}>
        <svg width="100%" viewBox="0 0 390 700" style={s.mapSvg}>

          {/* Maharashtra terrain blobs */}
          <ellipse cx="195" cy="420" rx="170" ry="290" fill="#D4EDE8" opacity="0.9" />
          <ellipse cx="80"  cy="500" rx="60"  ry="120" fill="#B8DDD7" opacity="0.7" />
          <ellipse cx="290" cy="350" rx="90"  ry="130" fill="#C8E6E0" opacity="0.6" />
          <ellipse cx="80"  cy="600" rx="55"  ry="90"  fill="#B8DDD7" opacity="0.5" />

          {/* Path lines */}
          {PATH.slice(0, -1).map((fromIdx, i) => {
            const toIdx = PATH[i + 1];
            const from = CITIES[fromIdx];
            const to   = CITIES[toIdx];
            const fromState = getCityState(fromIdx, currentLevel);
            const toState   = getCityState(toIdx, currentLevel);

            const isDoneToDone = fromState === 'done' && (toState === 'done' || toState === 'current');
            const isCurrentToNext = fromState === 'current' && toState === 'next';

            return (
              <line
                key={`path-${i}`}
                x1={from.x} y1={from.y}
                x2={to.x}   y2={to.y}
                stroke={isDoneToDone ? '#2A9D8F' : isCurrentToNext ? '#F4A261' : '#C8C8E0'}
                strokeWidth={isDoneToDone ? 3 : 2}
                strokeDasharray={isCurrentToNext ? '6 4' : isDoneToDone ? 'none' : '3 4'}
                opacity={isDoneToDone ? 1 : isCurrentToNext ? 0.9 : 0.5}
              />
            );
          })}

          {/* City nodes */}
          {CITIES.map((city, i) => {
            const state = getCityState(i, currentLevel);
            const size  = STATE_SIZES[state];
            const color = STATE_COLORS[state];
            const isSelected = selectedCity === i;

            return (
              <g key={city.id} onClick={() => setSelectedCity(isSelected ? null : i)} style={{ cursor: 'pointer' }}>
                {/* Pulse ring for current city */}
                {state === 'current' && (
                  <>
                    <circle cx={city.x} cy={city.y} r={size + 10} fill="none" stroke="#E76F51" strokeWidth="1.5" opacity="0.3" />
                    <circle cx={city.x} cy={city.y} r={size + 6}  fill="none" stroke="#E76F51" strokeWidth="1.5" opacity="0.5" />
                  </>
                )}
                {/* Goal glow */}
                {state === 'goal' && (
                  <circle cx={city.x} cy={city.y} r={size + 8} fill="none" stroke="#F4A261" strokeWidth="2" opacity="0.4" />
                )}
                {/* Selection ring */}
                {isSelected && (
                  <circle cx={city.x} cy={city.y} r={size + 7} fill="none" stroke={color} strokeWidth="2" opacity="0.6" />
                )}

                {/* Main dot */}
                <circle
                  cx={city.x} cy={city.y} r={size / 2}
                  fill={state === 'next' ? 'none' : color}
                  stroke={state === 'next' ? color : 'none'}
                  strokeWidth={state === 'next' ? 2 : 0}
                  strokeDasharray={state === 'next' ? '4 3' : 'none'}
                />

                {/* Icon inside dot */}
                <text x={city.x} y={city.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={state === 'current' ? 11 : state === 'goal' ? 13 : 9} fill={state === 'locked' ? '#9090B0' : '#fff'}>
                  {state === 'done' ? '✓' : state === 'goal' ? '🏆' : state === 'locked' ? '🔒' : state === 'current' ? '📍' : city.level}
                </text>

                {/* City label — show for done/current/next only */}
                {(state === 'done' || state === 'current' || state === 'next' || state === 'goal') && (
                  <>
                    <text
                      x={city.x > 200 ? city.x - size / 2 - 4 : city.x + size / 2 + 4}
                      y={city.y - 2}
                      textAnchor={city.x > 200 ? 'end' : 'start'}
                      fontSize="10"
                      fontWeight={state === 'current' ? '700' : '600'}
                      fill={state === 'current' ? '#E76F51' : '#3D405B'}
                    >
                      {city.name}
                    </text>
                    <text
                      x={city.x > 200 ? city.x - size / 2 - 4 : city.x + size / 2 + 4}
                      y={city.y + 10}
                      textAnchor={city.x > 200 ? 'end' : 'start'}
                      fontSize="9"
                      fill="#9090B0"
                    >
                      Lv {city.level}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── CITY DETAIL PANEL (tap on city) ── */}
      {selected && selectedState && (
        <div style={s.detailPanel}>
          <div style={s.detailHeader}>
            <div>
              <p style={{ ...s.detailCity, color: STATE_COLORS[selectedState] }}>
                <MapPinIcon size={14} weight="fill" style={{ verticalAlign: 'middle', marginRight: 4 }} />{selected.name}
              </p>
              <p style={s.detailRegion}>Level {selected.level} · {selected.region}</p>
            </div>
            <button style={s.detailClose} onClick={() => setSelectedCity(null)}><XIcon size={16} weight="bold" /></button>
          </div>

          <div style={s.detailContent}>
            <span style={{ ...s.contentBadge, background: 'var(--color-teal-subtle)', color: 'var(--color-teal)' }}>
              {selected.content}
            </span>
          </div>

          <div style={s.trackPills}>
            {[
              { Icon: BookOpenIcon,     label: 'Reading'  },
              { Icon: PencilSimpleIcon, label: 'Writing'  },
              { Icon: MicrophoneIcon,   label: 'Speaking' },
            ].map(({ Icon, label }) => (
              <span key={label} style={s.trackPill}>
                <Icon size={12} weight="duotone" style={{ verticalAlign: 'middle', marginRight: 3 }} />{label}
              </span>
            ))}
          </div>

          {selectedState === 'current' && (
            <button style={s.continueBtn} onClick={() => navigate('/lessons')}>
              Continue Level →
            </button>
          )}
          {selectedState === 'next' && (
            <button style={{ ...s.continueBtn, background: 'var(--color-gold)' }} onClick={() => navigate('/lessons')}>
              Preview Level →
            </button>
          )}
          {selectedState === 'locked' && (
            <p style={s.lockedNote}>Complete Level {selected.level - 1} to unlock</p>
          )}
          {selectedState === 'done' && (
            <button style={{ ...s.continueBtn, background: 'var(--color-success)' }} onClick={() => navigate('/lessons')}>
              Review Level ✓
            </button>
          )}
        </div>
      )}

      {/* ── BOTTOM INFO SHEET (current city, shown when no city selected) ── */}
      {!selected && (
        <div style={s.infoSheet}>
          <div style={s.infoSheetHeader}>
            <div>
              <p style={s.infoCity}><MapPinIcon size={14} weight="fill" style={{ verticalAlign: 'middle', marginRight: 4 }} />{currentCity.name}</p>
              <p style={s.infoDesc}>{currentCity.content} — {currentCity.region}</p>
            </div>
          </div>

          <div style={s.trackPills}>
            {[
              { Icon: BookOpenIcon,     label: 'Reading'  },
              { Icon: PencilSimpleIcon, label: 'Writing'  },
              { Icon: MicrophoneIcon,   label: 'Speaking' },
            ].map(({ Icon, label }) => (
              <span key={label} style={s.trackPill}>
                <Icon size={12} weight="duotone" style={{ verticalAlign: 'middle', marginRight: 3 }} />{label}
              </span>
            ))}
          </div>

          <div style={s.progressWrap}>
            <div style={s.progressBg}>
              <div style={{ ...s.progressFill, width: `${pct}%` }} />
            </div>
            <span style={s.progressPct}>{pct}% to Nagpur</span>
          </div>

          <button style={s.continueBtn} onClick={() => navigate('/lessons')}>
            Continue Level →
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 480, margin: '0 auto',
    fontFamily: 'var(--font-ui)',
    background: '#EDF4F2',
    minHeight: '100vh',
    paddingBottom: 82,
  },
  loadingPage: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    height: '100vh', gap: 12,
    background: '#EDF4F2',
  },
  loadingDot: {
    width: 40, height: 40, borderRadius: '50%',
    background: 'var(--color-teal)', opacity: 0.3,
  },

  // Header
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '52px 24px 12px',
    background: 'rgba(250,250,248,0.95)',
  },
  title: { fontSize: 22, fontWeight: 800, color: 'var(--color-slate)', margin: '0 0 2px' },
  headerMeta: { fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 },
  xpPill: {
    display: 'flex', alignItems: 'center', gap: 5,
    background: 'var(--color-teal-subtle)',
    borderRadius: 16, padding: '6px 12px',
  },
  xpPillText: { fontSize: 12, fontWeight: 600, color: 'var(--color-teal)' },

  // Map
  mapWrap: { width: '100%', position: 'relative' },
  mapSvg: { display: 'block' },

  // Route selection
  subtitle: { fontSize: 14, color: 'var(--color-text-secondary)', margin: '0 0 20px', padding: '0 24px' },
  routeCard: {
    background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
    padding: '16px 20px', marginBottom: 12,
    boxShadow: 'var(--shadow-sm)',
    display: 'flex', alignItems: 'center', gap: 14,
    marginLeft: 24, marginRight: 24,
  },
  routeIconWrap: {
    width: 48, height: 48, borderRadius: '50%',
    background: 'var(--color-teal-subtle)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  routeInfo: { flex: 1 },
  routeCity: { fontSize: 17, fontWeight: 700, color: 'var(--color-slate)', margin: '0 0 2px' },
  routeMarathi: { fontFamily: 'var(--font-devanagari)', fontSize: 15, color: 'var(--color-teal)', fontWeight: 600 },
  routeMeta: { fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 4px' },
  routeDesc: { fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.4, margin: 0 },
  startBtn: {
    background: 'var(--color-teal)', color: '#fff',
    border: 'none', borderRadius: 'var(--radius-2xl)',
    padding: '10px 18px', fontSize: 14, fontWeight: 700,
    cursor: 'pointer', flexShrink: 0,
  },

  // Bottom info sheet
  infoSheet: {
    background: 'var(--color-surface)',
    borderRadius: '20px 20px 0 0',
    padding: '20px 24px 24px',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
  },
  infoSheetHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  infoCity: { fontSize: 16, fontWeight: 700, color: 'var(--color-saffron)', margin: '0 0 2px' },
  infoDesc: { fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 },

  // City detail panel (tap)
  detailPanel: {
    background: 'var(--color-surface)',
    borderRadius: '20px 20px 0 0',
    padding: '20px 24px 24px',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
  },
  detailHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  detailCity: { fontSize: 16, fontWeight: 700, margin: '0 0 2px' },
  detailRegion: { fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 },
  detailClose: { background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: 'var(--color-muted)', padding: 4 },
  detailContent: { marginBottom: 12 },
  contentBadge: { borderRadius: 12, padding: '4px 12px', fontSize: 12, fontWeight: 600 },

  // Shared
  trackPills: { display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  trackPill: {
    background: 'var(--color-teal-subtle)', color: 'var(--color-teal)',
    borderRadius: 12, padding: '5px 12px', fontSize: 12, fontWeight: 600,
  },
  progressWrap: { marginBottom: 16 },
  progressBg: { height: 6, background: 'var(--color-border)', borderRadius: 3, marginBottom: 6 },
  progressFill: { height: '100%', background: 'var(--color-teal)', borderRadius: 3, transition: 'width 0.5s ease' },
  progressPct: { fontSize: 11, fontWeight: 600, color: 'var(--color-teal)' },
  continueBtn: {
    width: '100%', padding: '14px',
    background: 'var(--color-teal)', color: '#fff',
    border: 'none', borderRadius: 'var(--radius-2xl)',
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  lockedNote: { fontSize: 13, color: 'var(--color-muted)', textAlign: 'center', margin: '8px 0 0' },
};
