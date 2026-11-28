import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function SplashPage() {
  const navigate = useNavigate();
  const { initialized, user, onboardingComplete } = useAuthStore();

  useEffect(() => {
    if (!initialized) return;
    const timer = setTimeout(() => {
      if (!user) navigate('/login', { replace: true });
      else if (!onboardingComplete) navigate('/onboarding', { replace: true });
      else navigate('/dashboard', { replace: true });
    }, 1800);
    return () => clearTimeout(timer);
  }, [initialized, user, onboardingComplete]);

  return (
    <div style={s.page}>
      <div style={s.emblem}>म</div>
      <h1 style={s.title}>मराठी शिका</h1>
      <p style={s.sub}>Learn Marathi</p>
      <div style={s.dots}>
        <span style={{ ...s.dot, animationDelay: '0s' }} />
        <span style={{ ...s.dot, animationDelay: '0.2s' }} />
        <span style={{ ...s.dot, animationDelay: '0.4s' }} />
      </div>
      <style>{`
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'var(--color-teal)', gap: 8,
  },
  emblem: {
    width: 88, height: 88, borderRadius: '50%',
    background: 'rgba(255,255,255,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 44, color: '#fff', fontFamily: 'var(--font-devanagari)',
    marginBottom: 8,
  },
  title: {
    fontSize: 32, fontWeight: 800, color: '#fff', margin: 0,
    fontFamily: 'var(--font-devanagari)',
  },
  sub: { fontSize: 16, color: 'rgba(255,255,255,0.75)', margin: '4px 0 24px', fontFamily: 'var(--font-sans)' },
  dots: { display: 'flex', gap: 8 },
  dot: {
    width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.7)',
    display: 'inline-block',
    animation: 'dotPulse 1.2s ease-in-out infinite',
  },
};
