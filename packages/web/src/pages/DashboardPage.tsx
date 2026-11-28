import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { progressApi, gamificationApi, funFactsApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import BottomNav from '../components/BottomNav';
import { CardSkeleton } from '../components/Skeleton';
import { MicrophoneIcon, PencilSimpleIcon, BookOpenIcon, FireIcon, StarIcon, LightningIcon, MapTrifoldIcon, LightbulbIcon, PowerIcon, HandIcon } from '@phosphor-icons/react';

export default function DashboardPage() {
  const { user, xp, refreshXp, logout } = useAuthStore();
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

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const xpToNext = xp ? ([100,250,500,900,1400,2000,2800,3800,5000][xp.level - 1] ?? 5000) : 100;
  const xpProgress = xp ? Math.min(100, (xp.totalXp / xpToNext) * 100) : 0;

  if (loading) return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <div style={s.skeletonLine} />
          <div style={{ ...s.skeletonLine, width: 160, marginTop: 6 }} />
        </div>
        <div style={s.skeletonAvatar} />
      </div>
      <div style={s.pillRow}>
        {[80, 90, 60].map(w => <div key={w} style={{ ...s.skeletonPill, width: w }} />)}
      </div>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <BottomNav />
    </div>
  );

  return (
    <div style={s.page}>

      {/* ── HEADER ── */}
      <div style={s.header}>
        <div>
          <h2 style={s.greeting}>{greeting}, {firstName} <HandIcon size={20} weight="fill" color="var(--color-saffron)" style={{ verticalAlign: 'middle' }} /></h2>
          <p style={s.subGreeting}>Ready to learn Marathi today?</p>
        </div>
        <div style={s.headerRight}>
          <div style={s.avatarWrap}>
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="avatar" style={s.avatarImg} />
              : <span style={s.avatarInitial}>{firstName[0].toUpperCase()}</span>
            }
          </div>
          <button onClick={logout} style={s.logoutBtn} title="Logout"><PowerIcon size={18} weight="bold" /></button>
        </div>
      </div>

      {/* ── STREAK / XP / LEVEL PILLS ── */}
      <div style={s.pillRow}>
        <div style={{ ...s.pill, background: 'var(--color-saffron-subtle)' }}>
          <FireIcon size={14} weight="fill" color="var(--color-saffron)" />
          <span style={{ color: 'var(--color-saffron)', fontWeight: 600, fontSize: 12 }}>
            {streak?.currentStreak ?? 0} day streak
          </span>
        </div>
        <div style={{ ...s.pill, background: 'var(--color-teal-subtle)' }}>
          <StarIcon size={14} weight="fill" color="var(--color-teal)" />
          <span style={{ color: 'var(--color-teal)', fontWeight: 600, fontSize: 12 }}>
            {(xp?.totalXp ?? 0).toLocaleString()} XP
          </span>
        </div>
        <div style={{ ...s.pill, background: 'var(--color-slate-subtle)' }}>
          <span style={{ color: 'var(--color-slate)', fontWeight: 600, fontSize: 12 }}>
            Lv {xp?.level ?? 1}
          </span>
        </div>
      </div>

      {/* ── TODAY'S LESSON CARD ── */}
      {dashboard?.nextLesson ? (
        <div style={s.lessonCard} onClick={() => navigate(`/lessons/${dashboard.nextLesson.id}`)}>
          {/* Decorative circle */}
          <div style={s.lessonCardCircle} />

          <p style={s.lessonCardLabel}>TODAY'S LESSON</p>
          <h3 style={s.lessonCardTitle}>{dashboard.nextLesson.title}</h3>
          <p style={s.lessonCardMeta}>
            {dashboard.nextLesson.level} · {dashboard.nextLesson.estimatedMinutes} min
          </p>

          {/* Progress bar */}
          <div style={s.lessonProgressBg}>
            <div style={{ ...s.lessonProgressFill, width: `${xpProgress}%` }} />
          </div>
          <div style={s.lessonCardBottom}>
            <span style={s.lessonProgressPct}>{Math.round(xpProgress)}%</span>
            <div style={s.continueBtn}>Continue →</div>
          </div>
        </div>
      ) : (
        <div style={s.lessonCard} onClick={() => navigate('/lessons')}>
          <div style={s.lessonCardCircle} />
          <p style={s.lessonCardLabel}>START HERE</p>
          <h3 style={s.lessonCardTitle}>Vowels: अ आ इ ई</h3>
          <p style={s.lessonCardMeta}>Beginner · Unit 1 · 8 min</p>
          <div style={{ ...s.lessonProgressBg, marginTop: 16 }}>
            <div style={{ ...s.lessonProgressFill, width: '0%' }} />
          </div>
          <div style={s.lessonCardBottom}>
            <span style={s.lessonProgressPct}>0%</span>
            <div style={s.continueBtn}>Start →</div>
          </div>
        </div>
      )}

      {/* ── DAILY CHALLENGE BANNER ── */}
      {challenge && !challenge.completed && (
        <div style={s.challengeCard} onClick={() => navigate('/challenge')}>
          <div style={s.challengeLeft}>
            <p style={s.challengeLabel}><LightningIcon size={14} weight="fill" style={{ verticalAlign: 'middle', marginRight: 4 }} />Daily Challenge</p>
            <p style={s.challengeDesc}>{challenge.title ?? 'Translate 5 phrases'} · {challenge.xpReward ?? 50} XP reward</p>
          </div>
          <div style={s.challengeBtn}>Start</div>
        </div>
      )}

      {/* ── CONTINUE JOURNEY CARD ── */}
      <div style={s.journeyCard} onClick={() => navigate('/journey')}>
        <div>
          <p style={s.journeyTitle}><MapTrifoldIcon size={14} weight="duotone" style={{ verticalAlign: 'middle', marginRight: 4 }} />Journey to Pune</p>
          <p style={s.journeyMeta}>Mumbai → Pune · Next stop: Nashik</p>
          <div style={s.journeyProgressBg}>
            <div style={{ ...s.journeyProgressFill, width: `${Math.min(100, ((dashboard?.lessonsCompleted ?? 0) / 40) * 100)}%` }} />
          </div>
          <p style={s.journeyPct}>{Math.round(Math.min(100, ((dashboard?.lessonsCompleted ?? 0) / 40) * 100))}% to Nagpur</p>
        </div>
      </div>

      {/* ── QUICK PRACTICE ROW ── */}
      <p style={s.sectionLabel}>Quick Practice</p>
      <div style={s.practiceRow}>
        {[
          { Icon: MicrophoneIcon,   label: 'Speak', path: '/speaking', bg: 'var(--color-teal-subtle)',    color: 'var(--color-teal)'    },
          { Icon: PencilSimpleIcon, label: 'Write', path: '/writing',  bg: 'var(--color-saffron-subtle)', color: 'var(--color-saffron)' },
          { Icon: BookOpenIcon,     label: 'Read',  path: '/reading',  bg: 'var(--color-slate-subtle)',   color: 'var(--color-slate)'   },
        ].map(({ Icon, label, path, bg, color }) => (
          <div key={path} style={{ ...s.practiceCard, background: bg }} onClick={() => navigate(path)}>
            <Icon size={28} weight="duotone" color={color} />
            <span style={{ ...s.practiceLabel, color }}>{label}</span>
          </div>
        ))}
      </div>

      {/* ── FACT OF THE DAY ── */}
      {fact && (
        <div style={s.factCard}>
          <p style={s.factLabel}><LightbulbIcon size={14} weight="fill" style={{ verticalAlign: 'middle', marginRight: 4 }} />Did You Know?</p>
          <p style={s.factMarathi}>{fact.contentMarathi}</p>
          <p style={s.factEnglish}>{fact.contentEnglish}</p>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 480, margin: '0 auto',
    padding: '52px 24px 100px',
    fontFamily: 'var(--font-ui)',
    background: 'var(--color-bg)',
    minHeight: '100vh',
  },

  // Header
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting: { fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--color-slate)' },
  subGreeting: { fontSize: 13, color: 'var(--color-text-secondary)', margin: '4px 0 0' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  avatarWrap: {
    width: 40, height: 40, borderRadius: '50%',
    background: 'var(--color-teal)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' },
  avatarInitial: { fontSize: 18, fontWeight: 700, color: '#fff' },
  logoutBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--color-muted)', padding: 4 },

  // Pills
  pillRow: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  pill: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '7px 12px', borderRadius: 18,
    fontSize: 12,
  },

  // Today's lesson card
  lessonCard: {
    position: 'relative',
    background: 'var(--color-teal)',
    borderRadius: 20, padding: '20px 20px 16px',
    marginBottom: 12, cursor: 'pointer',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-teal)',
  },
  lessonCardCircle: {
    position: 'absolute', top: -30, right: -30,
    width: 130, height: 130, borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    pointerEvents: 'none',
  },
  lessonCardLabel: { fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: 1, margin: '0 0 6px', textTransform: 'uppercase' },
  lessonCardTitle: { fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 4px', fontFamily: 'var(--font-devanagari)' },
  lessonCardMeta: { fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '0 0 14px', textTransform: 'capitalize' },
  lessonProgressBg: { height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 2, marginBottom: 8 },
  lessonProgressFill: { height: '100%', background: '#fff', borderRadius: 2, transition: 'width 0.5s ease' },
  lessonCardBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  lessonProgressPct: { fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.9)' },
  continueBtn: {
    background: '#fff', color: 'var(--color-teal)',
    borderRadius: 18, padding: '6px 16px',
    fontSize: 12, fontWeight: 700,
  },

  // Daily challenge
  challengeCard: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'var(--color-saffron-subtle)',
    border: '1.5px solid var(--color-gold)',
    borderRadius: 'var(--radius-lg)', padding: '14px 16px',
    marginBottom: 12, cursor: 'pointer',
  },
  challengeLeft: { flex: 1 },
  challengeLabel: { fontSize: 14, fontWeight: 700, color: 'var(--color-saffron)', margin: '0 0 4px' },
  challengeDesc: { fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 },
  challengeBtn: {
    background: 'var(--color-saffron)', color: '#fff',
    borderRadius: 14, padding: '6px 16px',
    fontSize: 12, fontWeight: 700, flexShrink: 0, marginLeft: 12,
  },

  // Journey card
  journeyCard: {
    background: 'var(--color-slate-subtle)',
    borderRadius: 'var(--radius-lg)', padding: '14px 16px',
    marginBottom: 20, cursor: 'pointer',
  },
  journeyTitle: { fontSize: 14, fontWeight: 700, color: 'var(--color-slate)', margin: '0 0 4px' },
  journeyMeta: { fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 10px' },
  journeyProgressBg: { height: 6, background: 'var(--color-border)', borderRadius: 3, marginBottom: 6 },
  journeyProgressFill: { height: '100%', background: 'var(--color-slate)', borderRadius: 3, transition: 'width 0.5s ease' },
  journeyPct: { fontSize: 11, fontWeight: 600, color: 'var(--color-slate)', margin: 0 },

  // Quick practice
  sectionLabel: { fontSize: 16, fontWeight: 700, color: 'var(--color-slate)', margin: '0 0 12px' },
  practiceRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 },
  practiceCard: {
    borderRadius: 'var(--radius-lg)', padding: '16px 8px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    cursor: 'pointer',
  },
  practiceLabel: { fontSize: 13, fontWeight: 600 },

  // Fact card
  factCard: {
    background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
    padding: '16px 20px', boxShadow: 'var(--shadow-sm)', marginBottom: 8,
  },
  factLabel: { fontSize: 12, fontWeight: 700, color: 'var(--color-gold)', margin: '0 0 8px' },
  factMarathi: { fontFamily: 'var(--font-devanagari)', fontSize: 17, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 6px', lineHeight: 1.6 },
  factEnglish: { fontSize: 13, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 },

  // Skeletons
  skeletonLine: { height: 20, width: 200, background: 'var(--color-border)', borderRadius: 6 },
  skeletonAvatar: { width: 40, height: 40, borderRadius: '50%', background: 'var(--color-border)' },
  skeletonPill: { height: 32, borderRadius: 18, background: 'var(--color-border)' },
};
