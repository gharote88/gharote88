import type React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { icon: '🏠', label: 'Home',     path: '/dashboard' },
  { icon: '📚', label: 'Lessons',  path: '/lessons'   },
  { icon: '✍️', label: 'Write',    path: '/writing'   },
  { icon: '🗺️', label: 'Journey',  path: '/journey'   },
  { icon: '🎮', label: 'Games',    path: '/mini-games'},
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav style={s.nav}>
      {NAV_ITEMS.map(({ icon, label, path }) => {
        const active = pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
        return (
          <button key={path} style={s.btn} onClick={() => navigate(path)}>
            <span style={s.icon}>{icon}</span>
            <span style={{ ...s.label, ...(active ? s.labelActive : {}) }}>{label}</span>
            {active && <div style={s.activeDot} />}
          </button>
        );
      })}
    </nav>
  );
}

const s: Record<string, React.CSSProperties> = {
  nav: {
    position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
    width: '100%', maxWidth: 480, background: '#fff',
    borderTop: '1px solid #f0f0f0', display: 'flex',
    justifyContent: 'space-around', padding: '6px 0 8px', zIndex: 100,
    boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
  },
  btn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', position: 'relative', minWidth: 56 },
  icon: { fontSize: 22 },
  label: { fontSize: 10, color: '#aaa', fontWeight: 500 },
  labelActive: { color: '#FF6B35', fontWeight: 700 },
  activeDot: { position: 'absolute', bottom: -4, width: 4, height: 4, borderRadius: '50%', background: '#FF6B35' },
};
