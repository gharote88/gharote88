import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const { login, loading } = useAuthStore();
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await login();
      // Supabase OAuth redirects to /auth/callback — no manual navigate needed
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>मराठी शिका</h1>
        <p style={styles.subtitle}>Learn Marathi — Speak, Write, Read</p>

        <button style={styles.googleBtn} onClick={handleGoogleSignIn} disabled={loading}>
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="G"
            style={{ width: 20, marginRight: 8 }}
          />
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>

        <p style={styles.coppa}>
          For users under 13, parental consent is required (COPPA / UK GDPR Children's Code).
        </p>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
  },
  card: {
    background: '#fff', borderRadius: 24, padding: '48px 40px',
    textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    maxWidth: 400, width: '100%',
  },
  title: { fontSize: 36, fontWeight: 800, color: '#1a1a2e', margin: '0 0 8px' },
  subtitle: { color: '#666', marginBottom: 32, fontSize: 16 },
  googleBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '100%', padding: '14px 24px',
    border: '2px solid #e0e0e0', borderRadius: 12,
    background: '#fff', cursor: 'pointer', fontSize: 16,
    fontWeight: 600, color: '#333',
  },
  coppa: { fontSize: 12, color: '#999', marginTop: 24, lineHeight: 1.6 },
  error: { color: '#e53e3e', marginTop: 12, fontSize: 14 },
};
