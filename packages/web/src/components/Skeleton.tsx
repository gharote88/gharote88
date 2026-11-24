interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  return (
    <div style={{
      width, height, borderRadius,
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      ...style,
    }} />
  );
}

export function CardSkeleton() {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Skeleton height={18} width="60%" />
      <Skeleton height={13} width="40%" />
      <Skeleton height={13} width="80%" />
    </div>
  );
}

export function StatGridSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <Skeleton width={28} height={28} borderRadius="50%" />
          <Skeleton width="60%" height={14} />
          <Skeleton width="80%" height={10} />
        </div>
      ))}
    </div>
  );
}
