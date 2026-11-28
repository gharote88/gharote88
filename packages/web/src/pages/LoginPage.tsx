import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const { login, loading } = useAuthStore();
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await login();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div style={s.page}>
      {/* Decorative blobs */}
      <div style={s.blobTeal} />
      <div style={s.blobSaffron} />

      <div style={s.card}>
        {/* Brand emblem */}
        <div style={s.emblem}>
          <span style={s.emblemChar}>म</span>
        </div>

        {/* App name + taglines */}
        <h1 style={s.appName}>MarathiLearn</h1>
        <p style={s.taglineMarathi}>बोलणे • लिहिणे • वाचणे</p>
        <p style={s.taglineEnglish}>Speak • Write • Read</p>

        {/* Maharashtra map hint */}
        <div style={s.mapHint}>
          <span style={s.mapHintText}>🗺️&nbsp; Maharashtra Journey — 12 cities await</span>
        </div>

        {/* Google sign-in */}
        <button style={{ ...s.googleBtn, opacity: loading ? 0.7 : 1 }} onClick={handleGoogleSignIn} disabled={loading}>
          {!loading && (
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="G"
              style={{ width: 20, height: 20, marginRight: 10 }}
            />
          )}
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>

        {error && <p style={s.error}>{error}</p>}

        {/* COPPA note */}
        <p style={s.coppa}>
          For learners aged 10–20 · Parent controls available for under-13
        </p>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-bg)',
    fontFamily: 'var(--font-ui)',
    position: 'relative',
    overflow: 'hidden',
    padding: '24px 16px',
  },

  // Decorative background blobs
  blobTeal: {
    position: 'absolute',
    top: -120, left: -80,
    width: 400, height: 400,
    borderRadius: '50%',
    background: 'var(--color-teal)',
    opacity: 0.08,
    pointerEvents: 'none',
  },
  blobSaffron: {
    position: 'absolute',
    top: -60, right: -60,
    width: 280, height: 280,
    borderRadius: '50%',
    background: 'var(--color-saffron)',
    opacity: 0.07,
    pointerEvents: 'none',
  },

  card: {
    position: 'relative',
    width: '100%',
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 0,
  },

  // Brand emblem
  emblem: {
    width: 100, height: 100,
    borderRadius: '50%',
    background: 'var(--color-teal)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    boxShadow: 'var(--shadow-teal)',
  },
  emblemChar: {
    fontFamily: 'var(--font-devanagari)',
    fontSize: 48,
    fontWeight: 700,
    color: '#fff',
    lineHeight: 1,
  },

  appName: {
    fontSize: 28,
    fontWeight: 800,
    color: 'var(--color-slate)',
    margin: '0 0 8px',
    letterSpacing: '-0.5px',
  },
  taglineMarathi: {
    fontFamily: 'var(--font-devanagari)',
    fontSize: 16,
    color: 'var(--color-teal)',
    margin: '0 0 4px',
    fontWeight: 600,
  },
  taglineEnglish: {
    fontSize: 13,
    color: 'var(--color-text-secondary)',
    margin: '0 0 28px',
  },

  // Map hint
  mapHint: {
    width: '100%',
    padding: '16px 20px',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--color-teal-subtle)',
    marginBottom: 28,
    textAlign: 'center',
  },
  mapHintText: {
    fontSize: 13,
    color: 'var(--color-teal)',
    fontWeight: 600,
  },

  // Google button
  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '16px 24px',
    border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-2xl)',
    background: 'var(--color-surface)',
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--color-slate)',
    boxShadow: 'var(--shadow-sm)',
    transition: 'box-shadow 0.2s, transform 0.1s',
    marginBottom: 12,
  },

  error: {
    fontSize: 13,
    color: 'var(--color-error)',
    margin: '4px 0 8px',
    textAlign: 'center',
  },

  coppa: {
    fontSize: 11,
    color: 'var(--color-muted)',
    textAlign: 'center',
    lineHeight: 1.6,
    marginTop: 8,
    padding: '0 16px',
  },
};
