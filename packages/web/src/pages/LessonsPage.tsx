import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lessonsApi } from '../api/client';
import BottomNav from '../components/BottomNav';
import { MicrophoneIcon, PencilSimpleIcon, BookOpenIcon, GameControllerIcon, LockIcon, ArrowRightIcon } from '@phosphor-icons/react';

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
type Level = typeof LEVELS[number];

const LEVEL_LABELS: Record<Level, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const SKILLS = [
  { Icon: MicrophoneIcon,   label: 'Speaking', sub: 'Pronunciation & conversation', bg: 'var(--color-teal-subtle)',    color: 'var(--color-teal)',    path: '/speaking'   },
  { Icon: PencilSimpleIcon, label: 'Writing',  sub: 'Devanagari tracing',           bg: 'var(--color-saffron-subtle)', color: 'var(--color-saffron)', path: '/writing'    },
  { Icon: BookOpenIcon,     label: 'Reading',  sub: 'Passages & comprehension',     bg: 'var(--color-slate-subtle)',   color: 'var(--color-slate)',   path: '/reading'    },
  { Icon: GameControllerIcon, label: 'Games', sub: 'Mini-games & drills',           bg: 'var(--color-gold-subtle)',    color: 'var(--color-gold)',    path: '/mini-games' },
];

export default function LessonsPage() {
  const navigate = useNavigate();
  const [activeLevel, setActiveLevel] = useState<Level>('beginner');
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    lessonsApi.list(activeLevel)
      .then(data => setLessons(data.lessons ?? []))
      .finally(() => setLoading(false));
  }, [activeLevel]);

  return (
    <div style={s.page}>

      {/* ── HEADER ── */}
      <h2 style={s.title}>Lessons</h2>

      {/* ── LEVEL TABS ── */}
      <div style={s.tabs}>
        {LEVELS.map(level => (
          <button
            key={level}
            style={{ ...s.tab, ...(activeLevel === level ? s.tabActive : {}) }}
            onClick={() => setActiveLevel(level)}
          >
            {LEVEL_LABELS[level]}
          </button>
        ))}
      </div>

      {/* ── SKILL GRID ── */}
      <p style={s.sectionLabel}>Skills</p>
      <div style={s.skillGrid}>
        {SKILLS.map(({ Icon, label, sub, bg, color, path }) => (
          <div key={label} style={{ ...s.skillCard, background: bg }} onClick={() => navigate(path)}>
            <Icon size={26} weight="duotone" color={color} style={{ marginBottom: 4 }} />
            <span style={{ ...s.skillLabel, color }}>{label}</span>
            <span style={s.skillSub}>{sub}</span>
          </div>
        ))}
      </div>

      {/* ── LESSON LIST ── */}
      <p style={s.sectionLabel}>
        Unit 1 — {activeLevel === 'beginner' ? 'Vowels & Consonants' : activeLevel === 'intermediate' ? 'Words & Sentences' : 'Paragraphs & Poems'}
      </p>

      {loading ? (
        <div style={s.loadingWrap}>
          {[1, 2, 3].map(i => <div key={i} style={s.skeletonRow} />)}
        </div>
      ) : (
        <div style={s.list}>
          {lessons.length > 0 ? lessons.map((lesson, i) => {
            const status = lesson.userProgress?.status;
            const isDone   = status === 'completed';
            const isActive = status === 'in_progress' || (!isDone && i === 0);
            const isLocked = !isDone && !isActive;

            return (
              <div
                key={lesson.id}
                style={{ ...s.lessonRow, ...(isActive ? s.lessonRowActive : {}), ...(isLocked ? s.lessonRowLocked : {}) }}
                onClick={() => !isLocked && navigate(`/lessons/${lesson.id}`)}
              >
                {/* Number badge */}
                <div style={{ ...s.badge, background: isDone ? 'var(--color-success)' : isActive ? 'var(--color-teal)' : 'var(--color-border)' }}>
                  <span style={{ ...s.badgeText, color: isDone || isActive ? '#fff' : 'var(--color-muted)' }}>
                    {isDone ? '✓' : i + 1}
                  </span>
                </div>

                {/* Content */}
                <div style={s.lessonBody}>
                  <p style={{ ...s.lessonTitle, color: isLocked ? 'var(--color-muted)' : 'var(--color-slate)' }}>
                    {lesson.title}
                  </p>
                  <p style={s.lessonMeta}>
                    {lesson.estimatedMinutes} min
                    {lesson.topic ? ` · ${lesson.topic}` : ''}
                    {isDone ? ' · Completed' : isActive ? ' · In Progress' : ' · Locked'}
                  </p>
                </div>

                {/* Right icon */}
                {isLocked
                  ? <LockIcon size={16} color="var(--color-muted)" />
                  : <ArrowRightIcon size={18} weight="bold" color={isActive ? 'var(--color-teal)' : 'var(--color-border)'} />
                }
              </div>
            );
          }) : (
            // Fallback static lessons when API returns empty
            [
              { num: 1, title: 'Vowels: अ आ इ ई', meta: '8 min · Completed', done: true },
              { num: 2, title: 'Vowels: उ ऊ ए ऐ', meta: '10 min · In Progress', active: true },
              { num: 3, title: 'Consonants: क ख ग', meta: '12 min · Locked', locked: true },
            ].map(({ num, title, meta, done, active, locked }) => (
              <div key={num} style={{ ...s.lessonRow, ...(active ? s.lessonRowActive : {}), ...(locked ? s.lessonRowLocked : {}) }}>
                <div style={{ ...s.badge, background: done ? 'var(--color-success)' : active ? 'var(--color-teal)' : 'var(--color-border)' }}>
                  <span style={{ ...s.badgeText, color: done || active ? '#fff' : 'var(--color-muted)' }}>
                    {done ? '✓' : num}
                  </span>
                </div>
                <div style={s.lessonBody}>
                  <p style={{ ...s.lessonTitle, color: locked ? 'var(--color-muted)' : 'var(--color-slate)', fontFamily: 'var(--font-devanagari)' }}>{title}</p>
                  <p style={s.lessonMeta}>{meta}</p>
                </div>
                {locked ? <LockIcon size={16} color="var(--color-muted)" /> : <ArrowRightIcon size={18} weight="bold" color={active ? 'var(--color-teal)' : 'var(--color-border)'} />}
              </div>
            ))
          )}
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
  title: { fontSize: 24, fontWeight: 800, color: 'var(--color-slate)', margin: '0 0 20px' },

  // Level tabs
  tabs: { display: 'flex', gap: 8, marginBottom: 24 },
  tab: {
    flex: 1, padding: '9px 4px',
    borderRadius: 18, border: '1.5px solid var(--color-border)',
    background: 'var(--color-surface)', cursor: 'pointer',
    fontWeight: 600, fontSize: 13, color: 'var(--color-text-secondary)',
    transition: 'all 0.15s',
  },
  tabActive: {
    background: 'var(--color-teal)',
    borderColor: 'var(--color-teal)',
    color: '#fff',
  },

  // Section label
  sectionLabel: { fontSize: 16, fontWeight: 700, color: 'var(--color-slate)', margin: '0 0 12px' },

  // Skill grid
  skillGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 },
  skillCard: {
    borderRadius: 'var(--radius-lg)', padding: '16px',
    display: 'flex', flexDirection: 'column', gap: 4,
    cursor: 'pointer',
  },
  skillLabel: { fontSize: 15, fontWeight: 700 },
  skillSub:   { fontSize: 11, color: 'var(--color-text-secondary)' },

  // Lesson list
  loadingWrap: { display: 'flex', flexDirection: 'column', gap: 12 },
  skeletonRow: { height: 64, borderRadius: 'var(--radius-lg)', background: 'var(--color-border)' },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },

  lessonRow: {
    display: 'flex', alignItems: 'center', gap: 14,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)', padding: '14px 16px',
    border: '1px solid var(--color-border)',
    cursor: 'pointer',
  },
  lessonRowActive: {
    borderColor: 'var(--color-teal)',
    borderWidth: 1.5,
    background: 'var(--color-teal-subtle)',
  },
  lessonRowLocked: { cursor: 'default', opacity: 0.7 },

  badge: {
    width: 36, height: 36, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  badgeText: { fontSize: 14, fontWeight: 700 },

  lessonBody: { flex: 1 },
  lessonTitle: { fontSize: 14, fontWeight: 600, margin: '0 0 3px', fontFamily: 'var(--font-devanagari)' },
  lessonMeta:  { fontSize: 11, color: 'var(--color-text-secondary)', margin: 0, textTransform: 'capitalize' },
};
