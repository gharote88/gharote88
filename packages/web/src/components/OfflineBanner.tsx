import { useOfflineSync } from '../hooks/useOfflineSync';

export default function OfflineBanner() {
  const { isOnline, pendingCount } = useOfflineSync();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div style={{
      ...s.banner,
      background: isOnline ? '#fff3e0' : '#1a1a2e',
      color: isOnline ? '#92400e' : '#fff',
    }}>
      {isOnline ? (
        <>⟳ Syncing {pendingCount} offline action{pendingCount !== 1 ? 's' : ''}...</>
      ) : (
        <>📵 You're offline — progress will sync when reconnected</>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  banner: {
    position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
    width: '100%', maxWidth: 480, padding: '10px 16px',
    fontSize: 13, fontWeight: 600, textAlign: 'center',
    zIndex: 200, transition: 'background 0.3s',
  },
};
