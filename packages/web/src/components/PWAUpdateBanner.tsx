import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function PWAUpdateBanner() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();
  const [dismissed, setDismissed] = useState(false);

  if (!needRefresh || dismissed) return null;

  return (
    <div style={s.banner}>
      <span style={s.text}>🆕 New version available</span>
      <button style={s.updateBtn} onClick={() => updateServiceWorker(true)}>Update</button>
      <button style={s.dismissBtn} onClick={() => setDismissed(true)}>✕</button>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  banner: {
    position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
    background: '#1a1a2e', color: '#fff', borderRadius: 14,
    padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12,
    fontSize: 14, fontWeight: 600, zIndex: 300, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    whiteSpace: 'nowrap',
  },
  text: { flex: 1 },
  updateBtn: { background: '#FF6B35', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  dismissBtn: { background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 16, padding: '0 4px' },
};
