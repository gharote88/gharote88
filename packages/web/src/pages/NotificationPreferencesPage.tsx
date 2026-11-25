import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../api/client';
import { useNotifications } from '../hooks/useNotifications';

type Prefs = {
  streakReminders: boolean;
  dailyChallengeAlerts: boolean;
  factOfTheDay: boolean;
  preferredTime: string;
  timezone: string;
};

const CATEGORIES = [
  { key: 'streakReminders',      icon: '🔥', label: 'Streak Reminders',      desc: 'Daily reminder at 7 PM to keep your streak alive' },
  { key: 'dailyChallengeAlerts', icon: '⚡', label: 'Daily Challenge',        desc: 'Alert at 8 AM when a new challenge is available' },
  { key: 'factOfTheDay',         icon: '💡', label: 'Fact of the Day',        desc: 'Morning cultural trivia at 9 AM' },
] as const;

export default function NotificationPreferencesPage() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<Prefs>({
    streakReminders: true, dailyChallengeAlerts: true, factOfTheDay: true,
    preferredTime: '08:00', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [pushEnabled, setPushEnabled] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);

  // Register push subscription when pushEnabled flips to true
  useNotifications(pushEnabled);

  useEffect(() => {
    // Check current permission state
    if ('Notification' in window) setPermissionState(Notification.permission);
    setPushEnabled(!!localStorage.getItem('pushRegistered'));

    notificationsApi.preferences().then((res: any) => {
      setPrefs(p => ({ ...p, ...res }));
    }).catch(() => null).finally(() => setLoading(false));
  }, []);

  function toggle(key: keyof Omit<Prefs, 'preferredTime' | 'timezone'>) {
    setPrefs(p => ({ ...p, [key]: !p[key] }));
  }

  async function save() {
    setSaving(true);
    try {
      await notificationsApi.updatePreferences(prefs);
      setToast('✅ Preferences saved');
      setTimeout(() => setToast(''), 2500);
    } catch {
      setToast('Save failed');
      setTimeout(() => setToast(''), 2500);
    } finally {
      setSaving(false);
    }
  }

  async function requestPush() {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setPermissionState(perm);
    if (perm === 'granted') setPushEnabled(true);
  }

  if (loading) return <div style={s.loading}>Loading...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/dashboard')}>← Back</button>
        <h2 style={s.title}>Notifications</h2>
        <button style={s.saveBtn} onClick={save} disabled={saving}>
          {saving ? '...' : 'Save'}
        </button>
      </div>

      {/* Push permission */}
      <div style={s.pushCard}>
        <div style={s.pushRow}>
          <div>
            <p style={s.pushTitle}>Push Notifications</p>
            <p style={s.pushSub}>
              {permissionState === 'granted' ? '✅ Enabled' : permissionState === 'denied' ? '🚫 Blocked in browser settings' : 'Not yet enabled'}
            </p>
          </div>
          {permissionState !== 'granted' && permissionState !== 'denied' && (
            <button style={s.enableBtn} onClick={requestPush}>Enable</button>
          )}
          {permissionState === 'granted' && (
            <div style={s.onDot} />
          )}
        </div>
      </div>

      {/* Category toggles */}
      <p style={s.sectionLabel}>Notification Types</p>
      {CATEGORIES.map(({ key, icon, label, desc }) => (
        <div key={key} style={s.categoryRow}>
          <span style={s.catIcon}>{icon}</span>
          <div style={s.catInfo}>
            <p style={s.catLabel}>{label}</p>
            <p style={s.catDesc}>{desc}</p>
          </div>
          <button
            style={{ ...s.toggle, ...(prefs[key] ? s.toggleOn : s.toggleOff) }}
            onClick={() => toggle(key)}
            aria-label={`Toggle ${label}`}
          >
            <div style={{ ...s.toggleThumb, ...(prefs[key] ? s.toggleThumbOn : {}) }} />
          </button>
        </div>
      ))}

      {/* Preferred time */}
      <p style={s.sectionLabel}>Quiet Hours</p>
      <div style={s.timeCard}>
        <p style={s.timeLabel}>Preferred notification time</p>
        <input
          type="time"
          style={s.timeInput}
          value={prefs.preferredTime}
          onChange={e => setPrefs(p => ({ ...p, preferredTime: e.target.value }))}
        />
        <p style={s.timeSub}>Notifications won't be sent between 9 PM – 7 AM local time</p>
      </div>

      {/* Timezone */}
      <div style={s.tzCard}>
        <p style={s.timeLabel}>Timezone</p>
        <p style={s.tzVal}>{prefs.timezone}</p>
        <button style={s.tzBtn} onClick={() => setPrefs(p => ({ ...p, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }))}>
          Use device timezone
        </button>
      </div>

      {toast && <div style={s.toast}>{toast}</div>}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 480, margin: '0 auto', padding: '24px 16px 40px', fontFamily: 'var(--font-ui, system-ui)', background: 'var(--color-bg, #f8f9fa)', minHeight: '100vh' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 18, color: '#666' },
  header: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 },
  back: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#FF6B35', fontWeight: 600, padding: 0 },
  title: { flex: 1, fontSize: 20, fontWeight: 700, margin: 0, color: '#1a1a2e' },
  saveBtn: { background: '#FF6B35', color: '#fff', border: 'none', borderRadius: 10, padding: '7px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  pushCard: { background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  pushRow: { display: 'flex', alignItems: 'center', gap: 12 },
  pushTitle: { fontSize: 15, fontWeight: 700, color: '#1a1a2e', margin: '0 0 2px' },
  pushSub: { fontSize: 13, color: '#888', margin: 0 },
  enableBtn: { background: '#FF6B35', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 },
  onDot: { width: 10, height: 10, borderRadius: '50%', background: '#16a34a', flexShrink: 0 },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', margin: '0 0 10px', letterSpacing: 0.5 },
  categoryRow: { background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  catIcon: { fontSize: 24, flexShrink: 0 },
  catInfo: { flex: 1 },
  catLabel: { fontSize: 15, fontWeight: 600, color: '#1a1a2e', margin: '0 0 2px' },
  catDesc: { fontSize: 12, color: '#888', margin: 0 },
  toggle: { width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s', padding: 0 },
  toggleOn: { background: '#FF6B35' },
  toggleOff: { background: '#e5e7eb' },
  toggleThumb: { position: 'absolute', top: 2, left: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' },
  toggleThumbOn: { left: 22 },
  timeCard: { background: '#fff', borderRadius: 14, padding: '16px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  timeLabel: { fontSize: 13, fontWeight: 600, color: '#555', margin: '0 0 8px' },
  timeInput: { border: '2px solid #e5e7eb', borderRadius: 10, padding: '8px 12px', fontSize: 15, outline: 'none', marginBottom: 8 },
  timeSub: { fontSize: 12, color: '#aaa', margin: 0 },
  tzCard: { background: '#fff', borderRadius: 14, padding: '16px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  tzVal: { fontSize: 14, color: '#555', margin: '0 0 8px' },
  tzBtn: { background: '#f0f0f0', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer', color: '#555' },
  toast: { position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: '#1a1a2e', color: '#fff', borderRadius: 20, padding: '10px 24px', fontSize: 14, fontWeight: 600, zIndex: 300 },
};
