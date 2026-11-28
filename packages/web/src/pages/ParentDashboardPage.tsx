import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, progressApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { CardSkeleton, StatGridSkeleton } from '../components/Skeleton';

type Child = { id: string; name: string; email: string; age?: number; avatarUrl?: string };

type View = 'reauth' | 'dashboard' | 'link' | 'unlink_confirm';

export default function ParentDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [view, setView] = useState<View>('reauth');
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [childProgress, setChildProgress] = useState<any>(null);
  const [childStreak, setChildStreak] = useState<any>(null);
  const [childBadges, setChildBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');
  const [reauthError, setReauthError] = useState('');

  // If we just returned from the OAuth re-auth round-trip, skip the gate
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      // A fresh session (issued within the last 30 s) means we just re-authed
      const issuedAt = session.user.last_sign_in_at
        ? new Date(session.user.last_sign_in_at).getTime()
        : 0;
      if (Date.now() - issuedAt < 30_000) {
        setView('dashboard');
        loadChildren();
      }
    });
  }, []);

  // Re-auth gate: require Google re-sign before accessing parent controls
  async function handleReauth() {
    if (user?.role !== 'parent') {
      setReauthError('This section is only for parent accounts.');
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) throw error;
      // OAuth redirect will happen — mark intent so callback can return here
      sessionStorage.setItem('postReauthRedirect', '/parent');
    } catch (e: any) {
      setReauthError(e.message ?? 'Re-authentication failed');
    }
  }

  async function loadChildren() {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data } = await supabase
        .from('parent_child_links')
        .select('child_id, users!parent_child_links_child_id_fkey(id, display_name, email, age, avatar_url)')
        .eq('parent_id', authUser.id);
      const linked: Child[] = (data ?? []).map((row: any) => ({
        id: row.users.id,
        name: row.users.display_name ?? '',
        email: row.users.email ?? '',
        age: row.users.age,
        avatarUrl: row.users.avatar_url,
      }));
      setChildren(linked);
      if (linked.length > 0) selectChild(linked[0]);
    } finally {
      setLoading(false);
    }
  }

  async function selectChild(child: Child) {
    setSelectedChild(child);
    setLoading(true);
    try {
      const data = await progressApi.childDashboard(child.id);
      setChildProgress(data);
      setChildStreak(data.streak ?? null);
      setChildBadges(data.badges ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function linkChild() {
    setLinkError('');
    setLinkSuccess('');
    if (!linkEmail.trim()) { setLinkError('Enter child email'); return; }
    try {
      await authApi.linkChild(linkEmail.trim());
      setLinkSuccess(`✅ Linked ${linkEmail}`);
      setLinkEmail('');
      loadChildren();
    } catch (e: any) {
      setLinkError(e.message ?? 'Link failed');
    }
  }

  async function unlinkChild() {
    if (!selectedChild) return;
    try {
      await authApi.unlinkChild(selectedChild.id);
    } catch {
      // non-fatal — remove from local state regardless
    }
    setView('dashboard');
    setChildren(prev => prev.filter(c => c.id !== selectedChild.id));
    setSelectedChild(null);
    setChildProgress(null);
  }

  const isUnder13 = (selectedChild?.age ?? 99) < 13;
  const earnedBadges = childBadges.filter(b => b.earned);

  // ── Re-auth gate ────────────────────────────────────────────────────────────
  if (view === 'reauth') return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/dashboard')}>← Back</button>
        <h2 style={s.title}>Parent Dashboard</h2>
      </div>
      <div style={s.reauthCard}>
        <div style={s.reauthIcon}>🔐</div>
        <h3 style={s.reauthTitle}>Verify your identity</h3>
        <p style={s.reauthSub}>For your child's safety, please confirm before accessing parent controls.</p>
        <p style={s.reauthNote}>You'll be redirected to Google to confirm your identity.</p>
        {reauthError && <p style={s.error}>{reauthError}</p>}
        <button style={s.btnPrimary} onClick={handleReauth}>Confirm & Continue</button>
        <button style={s.btnSecondary} onClick={() => navigate('/dashboard')}>Cancel</button>
      </div>
    </div>
  );

  // ── Unlink confirm ──────────────────────────────────────────────────────────
  if (view === 'unlink_confirm') return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => setView('dashboard')}>← Back</button>
        <h2 style={s.title}>Unlink Account</h2>
      </div>
      <div style={s.confirmCard}>
        <div style={s.confirmIcon}>⚠️</div>
        <h3 style={s.confirmTitle}>Unlink {selectedChild?.name}?</h3>
        <p style={s.confirmSub}>You will no longer be able to view their progress. This cannot be undone.</p>
        <button style={{ ...s.btnPrimary, background: 'var(--color-error)' }} onClick={unlinkChild}>Yes, Unlink</button>
        <button style={s.btnSecondary} onClick={() => setView('dashboard')}>Cancel</button>
      </div>
    </div>
  );

  // ── Link child ──────────────────────────────────────────────────────────────
  if (view === 'link') return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => setView('dashboard')}>← Back</button>
        <h2 style={s.title}>Link Child Account</h2>
      </div>
      <div style={s.linkCard}>
        <p style={s.linkSub}>Enter your child's account email to link their progress to your parent account.</p>
        <input
          style={s.input}
          type="email"
          placeholder="child@example.com"
          value={linkEmail}
          onChange={e => setLinkEmail(e.target.value)}
        />
        {linkError && <p style={s.error}>{linkError}</p>}
        {linkSuccess && <p style={s.success}>{linkSuccess}</p>}
        <button style={s.btnPrimary} onClick={linkChild}>Link Account</button>
        <button style={s.btnSecondary} onClick={() => setView('dashboard')}>Cancel</button>
      </div>
    </div>
  );

  // ── Main dashboard ──────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/dashboard')}>← Back</button>
        <h2 style={s.title}>Parent Dashboard</h2>
        <button style={s.linkBtn} onClick={() => setView('link')}>+ Link Child</button>
      </div>

      {/* Child selector */}
      {children.length > 0 ? (
        <div style={s.childTabs}>
          {children.map(c => (
            <button
              key={c.id}
              style={{ ...s.childTab, ...(selectedChild?.id === c.id ? s.childTabActive : {}) }}
              onClick={() => selectChild(c)}
            >
              {c.avatarUrl
                ? <img src={c.avatarUrl} alt="" style={s.childAvatar} />
                : <span style={s.childAvatarPlaceholder}>👤</span>
              }
              <span style={s.childName}>{c.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      ) : (
        <div style={s.noChildren}>
          <p style={s.noChildrenText}>No children linked yet.</p>
          <button style={s.btnPrimary} onClick={() => setView('link')}>Link a Child Account</button>
        </div>
      )}

      {selectedChild && (
        <>
          {/* Child header */}
          <div style={s.childHeader}>
            <div>
              <h3 style={s.childFullName}>{selectedChild.name}</h3>
              <p style={s.childEmail}>{selectedChild.email}</p>
              {isUnder13 && <span style={s.coppaChip}>🔒 Under 13 — COPPA protected</span>}
            </div>
            <button style={s.unlinkBtn} onClick={() => setView('unlink_confirm')}>Unlink</button>
          </div>

          {loading ? (
            <>
              <StatGridSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : childProgress ? (
            <>
              {/* Stats */}
              <div style={s.statsGrid}>
                {[
                  { icon: '📚', val: childProgress.lessonsCompleted ?? 0, label: 'Lessons' },
                  { icon: '🔥', val: childStreak?.currentStreak ?? 0, label: 'Streak' },
                  { icon: '⭐', val: childProgress.totalXp ?? 0, label: 'Total XP' },
                  { icon: '🏅', val: earnedBadges.length, label: 'Badges' },
                ].map(({ icon, val, label }) => (
                  <div key={label} style={s.statCard}>
                    <span style={s.statIcon}>{icon}</span>
                    <span style={s.statVal}>{val}</span>
                    <span style={s.statLabel}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Skill breakdown */}
              <div style={s.section}>
                <p style={s.sectionLabel}>Skill Breakdown</p>
                {[
                  { label: 'Speaking accuracy', val: `${childProgress.speakingAvgScore ?? 0}%` },
                  { label: 'Characters mastered', val: childProgress.charactersMastered ?? 0 },
                  { label: 'Reading avg WPM', val: childProgress.avgWpm ?? 0 },
                  { label: 'Comprehension avg', val: `${childProgress.comprehensionAvg ?? 0}%` },
                ].map(({ label, val }) => (
                  <div key={label} style={s.skillRow}>
                    <span style={s.skillLabel}>{label}</span>
                    <span style={s.skillVal}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Streak */}
              <div style={s.section}>
                <p style={s.sectionLabel}>Streak</p>
                <div style={s.streakRow}>
                  <span style={s.streakFire}>🔥</span>
                  <span style={s.streakVal}>{childStreak?.currentStreak ?? 0} day current streak</span>
                  <span style={s.streakBest}>Best: {childStreak?.longestStreak ?? 0}</span>
                </div>
              </div>

              {/* Badges */}
              {earnedBadges.length > 0 && (
                <div style={s.section}>
                  <p style={s.sectionLabel}>Earned Badges</p>
                  <div style={s.badgeRow}>
                    {earnedBadges.map(b => (
                      <div key={b.id} style={s.badge}>
                        <span style={s.badgeIcon}>{b.icon ?? '🏅'}</span>
                        <span style={s.badgeName}>{b.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* COPPA notice — under-13 restrictions */}
              {isUnder13 && (
                <div style={s.coppaCard}>
                  <p style={s.coppaTitle}>🔒 COPPA Protections Active</p>
                  <ul style={s.coppaList}>
                    <li>Leaderboard participation is disabled</li>
                    <li>Display name shows first name + last initial only</li>
                    <li>No custom display name allowed</li>
                    <li>Social features are restricted</li>
                  </ul>
                </div>
              )}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 480, margin: '0 auto', padding: '24px 16px 40px', fontFamily: 'var(--font-sans)', background: 'var(--color-bg)', minHeight: '100vh' },
  header: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 },
  back: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--color-teal)', fontWeight: 600, padding: 0 },
  title: { flex: 1, fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--color-slate)' },
  linkBtn: { background: 'var(--color-teal)', color: '#fff', border: 'none', borderRadius: 10, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  reauthCard: { background: 'var(--color-surface)', borderRadius: 20, padding: '32px 24px', textAlign: 'center', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', gap: 12 },
  reauthIcon: { fontSize: 48 },
  reauthTitle: { fontSize: 20, fontWeight: 700, color: 'var(--color-slate)', margin: 0 },
  reauthSub: { fontSize: 14, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 },
  reauthNote: { fontSize: 13, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 },
  error: { color: 'var(--color-error)', fontSize: 13, margin: 0 },
  success: { color: 'var(--color-success)', fontSize: 13, margin: 0 },
  btnPrimary: { background: 'var(--color-teal)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer' },
  btnSecondary: { background: 'var(--color-border)', color: 'var(--color-text)', border: 'none', borderRadius: 12, padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  confirmCard: { background: 'var(--color-surface)', borderRadius: 20, padding: '32px 24px', textAlign: 'center', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', gap: 12 },
  confirmIcon: { fontSize: 48 },
  confirmTitle: { fontSize: 20, fontWeight: 700, color: 'var(--color-slate)', margin: 0 },
  confirmSub: { fontSize: 14, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 },
  linkCard: { background: 'var(--color-surface)', borderRadius: 20, padding: '24px', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', gap: 12 },
  linkSub: { fontSize: 14, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 },
  input: { width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid var(--color-border)', fontSize: 15, outline: 'none', boxSizing: 'border-box', background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'var(--font-sans)' },
  childTabs: { display: 'flex', gap: 10, marginBottom: 20, overflowX: 'auto' },
  childTab: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 14, padding: '10px 14px', cursor: 'pointer', flexShrink: 0 },
  childTabActive: { border: '2px solid var(--color-teal)', background: 'var(--color-teal-subtle)' },
  childAvatar: { width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' },
  childAvatarPlaceholder: { fontSize: 28 },
  childName: { fontSize: 12, fontWeight: 600, color: 'var(--color-text)' },
  noChildren: { textAlign: 'center', padding: '40px 0', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' },
  noChildrenText: { fontSize: 15, color: 'var(--color-text-muted)', margin: 0 },
  childHeader: { background: 'var(--color-surface)', borderRadius: 16, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', boxShadow: 'var(--shadow-sm)' },
  childFullName: { fontSize: 18, fontWeight: 700, color: 'var(--color-slate)', margin: '0 0 2px' },
  childEmail: { fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 6px' },
  coppaChip: { background: 'var(--color-gold-subtle)', color: 'var(--color-slate)', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 },
  unlinkBtn: { marginLeft: 'auto', background: 'none', border: '1px solid var(--color-border)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'var(--color-error)', cursor: 'pointer', fontWeight: 600 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 },
  statCard: { background: 'var(--color-surface)', borderRadius: 12, padding: '12px 8px', textAlign: 'center', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 2 },
  statIcon: { fontSize: 20 },
  statVal: { fontSize: 18, fontWeight: 800, color: 'var(--color-slate)' },
  statLabel: { fontSize: 10, color: 'var(--color-text-muted)' },
  section: { background: 'var(--color-surface)', borderRadius: 16, padding: '16px 20px', marginBottom: 12, boxShadow: 'var(--shadow-sm)' },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', margin: '0 0 12px', letterSpacing: 0.5 },
  skillRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, marginBottom: 8, borderBottom: '1px solid var(--color-border)' },
  skillLabel: { fontSize: 14, color: 'var(--color-text-muted)' },
  skillVal: { fontSize: 15, fontWeight: 700, color: 'var(--color-slate)' },
  streakRow: { display: 'flex', alignItems: 'center', gap: 8 },
  streakFire: { fontSize: 20 },
  streakVal: { flex: 1, fontSize: 15, fontWeight: 700, color: 'var(--color-saffron)' },
  streakBest: { fontSize: 12, color: 'var(--color-text-muted)' },
  badgeRow: { display: 'flex', flexWrap: 'wrap', gap: 10 },
  badge: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'var(--color-bg)', borderRadius: 12, padding: '10px', minWidth: 64 },
  badgeIcon: { fontSize: 28 },
  badgeName: { fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textAlign: 'center' },
  coppaCard: { background: 'var(--color-gold-subtle)', border: '1px solid var(--color-gold)', borderRadius: 16, padding: '16px 20px', marginTop: 8 },
  coppaTitle: { fontSize: 14, fontWeight: 700, color: 'var(--color-slate)', margin: '0 0 8px' },
  coppaList: { margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 },
};
