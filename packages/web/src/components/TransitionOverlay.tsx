import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ConfettiIcon, MedalIcon, FireIcon } from '@phosphor-icons/react';

export type OverlayVariant = 'lesson-complete' | 'badge-unlock' | 'streak-celebration';

interface Props {
  variant: OverlayVariant;
  xp?: number;
  score?: number;
  badgeName?: string;
  badgeIcon?: string;
  streakDays?: number;
  onDismiss: () => void;
}

const CONFIGS = {
  'lesson-complete': {
    bg: 'linear-gradient(160deg, var(--color-teal) 0%, var(--color-teal-dark) 100%)',
    emoji: ConfettiIcon,
    title: 'Lesson Complete!',
    titleMarathi: 'शाब्बास!',
    autoDismiss: 3500,
  },
  'badge-unlock': {
    bg: 'linear-gradient(160deg, var(--color-slate) 0%, #252550 100%)',
    emoji: MedalIcon,
    title: 'Badge Unlocked!',
    titleMarathi: 'नवीन बॅज!',
    autoDismiss: 3500,
  },
  'streak-celebration': {
    bg: 'linear-gradient(160deg, var(--color-saffron) 0%, var(--color-gold) 100%)',
    emoji: FireIcon,
    title: 'Streak Milestone!',
    titleMarathi: 'वाह!',
    autoDismiss: 3000,
  },
};

export default function TransitionOverlay({ variant, xp, score, badgeName, badgeIcon, streakDays, onDismiss }: Props) {
  const cfg = CONFIGS[variant];

  useEffect(() => {
    const t = setTimeout(onDismiss, cfg.autoDismiss);
    return () => clearTimeout(t);
  }, [variant]);

  const content = (
    <div style={{ ...s.backdrop, background: cfg.bg }} onClick={onDismiss}>
      <div style={s.card} onClick={e => e.stopPropagation()}>
        {/* Decorative rings */}
        <div style={s.ring1} />
        <div style={s.ring2} />

        <div style={s.emojiWrap}>
          {variant === 'badge-unlock' && badgeIcon
            ? <span style={s.mainEmoji}>{badgeIcon}</span>
            : <span style={s.mainEmoji}>
              <span style={{ fontSize: 24, verticalAlign: 'middle' }}>
                <cfg.emoji size={52} weight="fill" color="#fff"/>
              </span>
            </span>
          }
        </div>

        <p style={s.marathiTitle}>{cfg.titleMarathi}</p>
        <h2 style={s.title}>{cfg.title}</h2>

        {/* Variant-specific content */}
        {variant === 'lesson-complete' && (
          <div style={s.statsRow}>
            {score !== undefined && (
              <div style={s.statPill}>
                <span style={s.statVal}>{score}%</span>
                <span style={s.statLabel}>Score</span>
              </div>
            )}
            {xp !== undefined && (
              <div style={{ ...s.statPill, background: 'rgba(255,255,255,0.25)' }}>
                <span style={s.statVal}>+{xp} XP</span>
                <span style={s.statLabel}>Earned</span>
              </div>
            )}
          </div>
        )}

        {variant === 'badge-unlock' && badgeName && (
          <div style={s.badgeNamePill}>{badgeName}</div>
        )}

        {variant === 'streak-celebration' && streakDays !== undefined && (
          <div style={s.streakCount}>
            <span style={s.streakNum}>{streakDays}</span>
            <span style={s.streakLabel}>day streak!</span>
          </div>
        )}

        <button style={s.dismissBtn} onClick={onDismiss}>
          {variant === 'lesson-complete' ? 'Continue →' : 'Awesome!'}
        </button>
        <p style={s.tapHint}>Tap anywhere to continue</p>
      </div>

      <style>{`
        @keyframes overlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes emojiPop {
          0%   { transform: scale(0); }
          60%  { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes ringPulse {
          0%   { transform: scale(0.8); opacity: 0.4; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );

  return createPortal(content, document.body);
}

const s: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: 'overlayIn 0.25s ease both',
    padding: 24,
  },
  card: {
    position: 'relative', width: '100%', maxWidth: 360,
    background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)',
    borderRadius: 28, padding: '40px 28px 28px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    border: '1px solid rgba(255,255,255,0.25)',
    animation: 'cardIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
    overflow: 'hidden',
  },
  ring1: {
    position: 'absolute', width: 200, height: 200, borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.2)',
    top: -60, right: -60, pointerEvents: 'none',
    animation: 'ringPulse 2s ease-out infinite',
  },
  ring2: {
    position: 'absolute', width: 160, height: 160, borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.15)',
    bottom: -40, left: -40, pointerEvents: 'none',
    animation: 'ringPulse 2s ease-out 0.5s infinite',
  },
  emojiWrap: {
    width: 96, height: 96, borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  mainEmoji: {
    fontSize: 52,
    display: 'block',
    animation: 'emojiPop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s both',
  },
  marathiTitle: {
    fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.75)',
    margin: 0, fontFamily: 'var(--font-devanagari)',
  },
  title: {
    fontSize: 28, fontWeight: 800, color: '#fff',
    margin: '0 0 8px', textAlign: 'center',
  },
  statsRow: { display: 'flex', gap: 12, marginBottom: 4 },
  statPill: {
    background: 'rgba(255,255,255,0.18)', borderRadius: 16,
    padding: '10px 20px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 2,
  },
  statVal: { fontSize: 22, fontWeight: 800, color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 500 },
  badgeNamePill: {
    background: 'rgba(255,255,255,0.2)', borderRadius: 20,
    padding: '8px 20px', fontSize: 15, fontWeight: 700, color: '#fff',
    marginBottom: 4,
  },
  streakCount: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
    marginBottom: 4,
  },
  streakNum: { fontSize: 56, fontWeight: 900, color: '#fff', lineHeight: 1 },
  streakLabel: { fontSize: 16, color: 'rgba(255,255,255,0.85)', fontWeight: 600 },
  dismissBtn: {
    marginTop: 8, padding: '14px 40px', borderRadius: 14,
    background: '#fff', border: 'none', cursor: 'pointer',
    fontSize: 16, fontWeight: 700, color: 'var(--color-slate)',
    width: '100%',
  },
  tapHint: { fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 },
};
