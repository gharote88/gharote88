import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lessonsApi } from '../api/client';

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
type Level = typeof LEVELS[number];

const LEVEL_COLORS: Record<Level, string> = {
  beginner: '#4CAF50',
  intermediate: '#FF9800',
  advanced: '#F44336',
};

export default function LessonsPage() {
  const navigate = useNavigate();
  const [activeLevel, setActiveLevel] = useState<Level>('beginner');
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    lessonsApi.list(activeLevel).then(data => setLessons(data.lessons ?? [])).finally(() => setLoading(false));
  }, [activeLevel]);

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Lessons</h2>

      {/* Level Tabs */}
      <div style={styles.tabs}>
        {LEVELS.map(level => (
          <button
            key={level}
            style={{ ...styles.tab, ...(activeLevel === level ? { background: LEVEL_COLORS[level], color: '#fff' } : {}) }}
            onClick={() => setActiveLevel(level)}
          >
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
      </div>

      {/* Lesson Cards */}
      {loading ? (
        <div style={styles.loading}>Loading lessons...</div>
      ) : (
        <div style={styles.list}>
          {lessons.map((lesson, i) => (
            <div key={lesson.id} style={styles.card} onClick={() => navigate(`/lessons/${lesson.id}`)}>
              <div style={{ ...styles.cardNum, background: LEVEL_COLORS[activeLevel] }}>{i + 1}</div>
              <div style={styles.cardBody}>
                <h3 style={styles.cardTitle}>{lesson.title}</h3>
                <p style={styles.cardMarathi}>{lesson.titleMarathi}</p>
                <div style={styles.cardMeta}>
                  <span style={styles.metaTag}>{lesson.topic}</span>
                  <span style={styles.metaTime}>⏱ {lesson.estimatedMinutes} min</span>
                </div>
              </div>
              {lesson.userProgress?.status === 'completed' && <span style={styles.checkmark}>✓</span>}
              <span style={styles.arrow}>›</span>
            </div>
          ))}
          {!lessons.length && <p style={styles.empty}>No lessons found for this level.</p>}
        </div>
      )}

      <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Dashboard</button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 480, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif', background: '#f8f9fa', minHeight: '100vh' },
  title: { fontSize: 24, fontWeight: 800, color: '#1a1a2e', margin: '0 0 20px' },
  tabs: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: { flex: 1, padding: '10px', borderRadius: 12, border: '2px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#666', transition: 'all 0.2s' },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: '#fff', borderRadius: 16, padding: '16px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'transform 0.15s' },
  cardNum: { width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16, flexShrink: 0 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: '0 0 2px' },
  cardMarathi: { fontSize: 14, color: '#666', margin: '0 0 6px' },
  cardMeta: { display: 'flex', gap: 8, alignItems: 'center' },
  metaTag: { background: '#f0f0f0', borderRadius: 20, padding: '2px 8px', fontSize: 11, color: '#666', textTransform: 'capitalize' },
  metaTime: { fontSize: 11, color: '#888' },
  checkmark: { color: '#4CAF50', fontWeight: 800, fontSize: 18 },
  arrow: { color: '#ccc', fontSize: 24 },
  loading: { textAlign: 'center', padding: 40, color: '#888' },
  empty: { textAlign: 'center', color: '#888', padding: 40 },
  backBtn: { marginTop: 24, background: 'none', border: 'none', color: '#FF6B35', fontWeight: 600, cursor: 'pointer', fontSize: 15 },
};
