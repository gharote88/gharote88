import type React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HouseIcon, BooksIcon, MapTrifoldIcon, UserIcon } from '@phosphor-icons/react';

const NAV_ITEMS = [
  { Icon: HouseIcon,        label: 'Home',    path: '/dashboard' },
  { Icon: BooksIcon,        label: 'Lessons', path: '/lessons'   },
  { Icon: MapTrifoldIcon,   label: 'Journey', path: '/journey'   },
  { Icon: UserIcon,         label: 'Profile', path: '/progress'  },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav style={s.nav}>
      {NAV_ITEMS.map(({ Icon, label, path }) => {
        const active = pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
        return (
          <button key={path} style={s.btn} onClick={() => navigate(path)}>
            <Icon
              size={24}
              weight={active ? 'fill' : 'regular'}
              color={active ? 'var(--color-teal)' : 'var(--color-muted)'}
            />
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
    width: '100%', maxWidth: 480,
    background: 'var(--color-surface)',
    borderTop: '1px solid var(--color-border)',
    display: 'flex', justifyContent: 'space-around',
    padding: '8px 0 12px', zIndex: 100,
    boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
  },
  btn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '4px 16px', position: 'relative', minWidth: 64,
  },
  label:       { fontSize: 10, color: 'var(--color-muted)', fontWeight: 500 },
  labelActive: { color: 'var(--color-teal)', fontWeight: 700 },
  activeDot: {
    position: 'absolute', bottom: -4,
    width: 4, height: 4, borderRadius: '50%',
    background: 'var(--color-teal)',
  },
};
