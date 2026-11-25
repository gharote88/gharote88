import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.emoji}>⚠️</div>
          <h2 style={s.title}>Something went wrong</h2>
          <p style={s.msg}>{this.state.message}</p>
          <button style={s.btn} onClick={() => window.location.reload()}>Reload</button>
        </div>
      </div>
    );
  }
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', fontFamily: 'system-ui, sans-serif' },
  card: { background: '#fff', borderRadius: 20, padding: '40px 32px', textAlign: 'center', maxWidth: 360, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: 700, color: '#1a1a2e', margin: '0 0 8px' },
  msg: { fontSize: 13, color: '#888', margin: '0 0 24px', lineHeight: 1.5, wordBreak: 'break-word' },
  btn: { background: '#FF6B35', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
};
