import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../api/client';
import { useAuthStore } from '../store/authStore';

type AvatarItem = {
  id: string; name: string; category: string; imageUrl?: string;
  xpCost: number; levelRequired: number; unlocked: boolean; canUnlock: boolean;
};
type Category = 'all' | 'hair' | 'outfit' | 'accessory' | 'background';

const CATEGORY_ICONS: Record<string, string> = {
  all: '🎨', hair: '💇', outfit: '👕', accessory: '💍', background: '🖼️',
};

export default function AvatarPage() {
  const navigate = useNavigate();
  const { xp, refreshXp } = useAuthStore();
  const [items, setItems] = useState<AvatarItem[]>([]);
  const [equipped, setEquipped] = useState<string[]>([]);
  const [category, setCategory] = useState<Category>('all');
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    profileApi.avatar().then((res: any) => {
      setItems(res.items ?? []);
      setEquipped(res.equippedItems ?? []);
    }).finally(() => setLoading(false));
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  async function unlock(item: AvatarItem) {
    if (unlocking) return;
    setUnlocking(item.id);
    try {
      await profileApi.unlockItem(item.id);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, unlocked: true } : i));
      await refreshXp();
      showToast(`🎉 Unlocked ${item.name}!`);
    } catch (e: any) {
      showToast(e.message ?? 'Unlock failed');
    } finally {
      setUnlocking(null);
    }
  }

  function toggleEquip(item: AvatarItem) {
    if (!item.unlocked) return;
    setEquipped(prev =>
      prev.includes(item.id)
        ? prev.filter(id => id !== item.id)
        : [...prev.filter(id => {
            const existing = items.find(i => i.id === id);
            return existing?.category !== item.category;
          }), item.id]
    );
  }

  async function save() {
    setSaving(true);
    try {
      await profileApi.updateAvatar(equipped);
      showToast('✅ Avatar saved!');
    } catch {
      showToast('Save failed');
    } finally {
      setSaving(false);
    }
  }

  const categories: Category[] = ['all', 'hair', 'outfit', 'accessory', 'background'];
  const filtered = category === 'all' ? items : items.filter(i => i.category === category);
  const equippedItems = items.filter(i => equipped.includes(i.id));

  if (loading) return <div style={s.loading}>Loading avatar...</div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/dashboard')}>← Back</button>
        <h2 style={s.title}>Avatar</h2>
        <button style={s.saveBtn} onClick={save} disabled={saving}>
          {saving ? '...' : 'Save'}
        </button>
      </div>

      {/* XP display */}
      <div style={s.xpRow}>
        <span style={s.xpLabel}>Available XP</span>
        <span style={s.xpVal}>{xp?.totalXp ?? 0} XP</span>
      </div>

      {/* Avatar preview */}
      <div style={s.preview}>
        <div style={s.avatarCircle}>
          {equippedItems.length === 0
            ? <span style={s.avatarPlaceholder}>👤</span>
            : equippedItems.map(i => i.imageUrl
                ? <img key={i.id} src={i.imageUrl} alt={i.name} style={s.avatarLayer} />
                : <span key={i.id} style={s.avatarEmoji}>🎭</span>
              )
          }
        </div>
        <div style={s.equippedChips}>
          {equippedItems.map(i => (
            <span key={i.id} style={s.equippedChip}>{i.name}</span>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div style={s.tabs}>
        {categories.map(c => (
          <button
            key={c}
            style={{ ...s.tab, ...(category === c ? s.tabActive : {}) }}
            onClick={() => setCategory(c)}
          >
            {CATEGORY_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {/* Item grid */}
      <div style={s.grid}>
        {filtered.map(item => {
          const isEquipped = equipped.includes(item.id);
          const isUnlocking = unlocking === item.id;
          return (
            <div
              key={item.id}
              style={{
                ...s.itemCard,
                ...(isEquipped ? s.itemEquipped : {}),
                ...(item.unlocked ? { cursor: 'pointer' } : {}),
              }}
              onClick={() => item.unlocked && toggleEquip(item)}
            >
              <div style={s.itemImg}>
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  : <span style={s.itemEmoji}>{CATEGORY_ICONS[item.category] ?? '🎨'}</span>
                }
                {isEquipped && <div style={s.equippedBadge}>✓</div>}
                {!item.unlocked && <div style={s.lockedOverlay}>🔒</div>}
              </div>
              <span style={s.itemName}>{item.name}</span>
              {!item.unlocked && (
                <button
                  style={{
                    ...s.unlockBtn,
                    ...(item.canUnlock ? s.unlockBtnActive : s.unlockBtnDisabled),
                  }}
                  disabled={!item.canUnlock || !!unlocking}
                  onClick={e => { e.stopPropagation(); unlock(item); }}
                >
                  {isUnlocking ? '...' : item.canUnlock ? `${item.xpCost} XP` : `Lv ${item.levelRequired}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={s.empty}>No items in this category yet.</div>
      )}

      {toast && <div style={s.toast}>{toast}</div>}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 480, margin: '0 auto', padding: '24px 16px 40px', fontFamily: 'system-ui, sans-serif', background: '#f8f9fa', minHeight: '100vh' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 18, color: '#666' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  back: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#FF6B35', fontWeight: 600, padding: 0 },
  title: { flex: 1, fontSize: 20, fontWeight: 700, margin: 0, color: '#1a1a2e' },
  saveBtn: { background: '#FF6B35', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  xpRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: 12, padding: '10px 16px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  xpLabel: { fontSize: 13, color: '#888' },
  xpVal: { fontSize: 16, fontWeight: 800, color: '#FF6B35' },
  preview: { background: '#fff', borderRadius: 20, padding: '20px', marginBottom: 16, textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  avatarCircle: { width: 100, height: 100, borderRadius: '50%', background: '#f0f0f0', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', border: '3px solid #FF6B35' },
  avatarPlaceholder: { fontSize: 48 },
  avatarLayer: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  avatarEmoji: { fontSize: 40 },
  equippedChips: { display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  equippedChip: { background: '#fff3e0', color: '#FF6B35', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 },
  tabs: { display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 },
  tab: { flexShrink: 0, padding: '7px 12px', borderRadius: 20, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#666', whiteSpace: 'nowrap' },
  tabActive: { background: '#FF6B35', color: '#fff', border: '1px solid #FF6B35' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 },
  itemCard: { background: '#fff', borderRadius: 16, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'relative' },
  itemEquipped: { border: '2px solid #FF6B35', background: '#fff8f5' },
  itemImg: { width: 64, height: 64, borderRadius: 12, background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  itemEmoji: { fontSize: 32 },
  equippedBadge: { position: 'absolute', top: 2, right: 2, background: '#FF6B35', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 },
  lockedOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, borderRadius: 12 },
  itemName: { fontSize: 11, fontWeight: 600, color: '#444', textAlign: 'center' },
  unlockBtn: { width: '100%', border: 'none', borderRadius: 8, padding: '5px 0', fontSize: 11, fontWeight: 700, cursor: 'pointer' },
  unlockBtnActive: { background: '#FF6B35', color: '#fff' },
  unlockBtnDisabled: { background: '#f0f0f0', color: '#aaa', cursor: 'not-allowed' },
  empty: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 15 },
  toast: { position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: '#1a1a2e', color: '#fff', borderRadius: 20, padding: '10px 24px', fontSize: 14, fontWeight: 600, zIndex: 300, whiteSpace: 'nowrap' },
};
