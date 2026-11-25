import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { funFactsApi, gamificationApi } from '../api/client';

type Fact = { id: string; category: string; contentMarathi: string; contentEnglish: string; imageUrl?: string; vocabulary?: { word: string; meaning: string; transliteration: string }[]; isFavorite?: boolean };
type View = 'browse' | 'favorites' | 'quiz';

export default function FunFactsPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('browse');
  const [fact, setFact] = useState<Fact | null>(null);
  const [favorites, setFavorites] = useState<Fact[]>([]);
  const [quiz, setQuiz] = useState<any>(null);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [quizDone, setQuizDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRandom();
    funFactsApi.favorites().then((res: any) => {
      const facts = res.facts || [];
      setFavorites(facts);
      setFavoriteIds(new Set(facts.map((f: Fact) => f.id)));
    }).catch(() => null);
  }, []);

  async function loadRandom() {
    setLoading(true);
    try {
      const res: any = await funFactsApi.random();
      setFact(res);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite(id: string) {
    await funFactsApi.toggleFavorite(id).catch(() => null);
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    // Refresh favorites list
    funFactsApi.favorites().then((res: any) => setFavorites(res.facts || [])).catch(() => null);
  }

  async function loadQuiz() {
    setView('quiz');
    setQuizAnswer(null);
    setQuizDone(false);
    setLoading(true);
    try {
      const res: any = await funFactsApi.today();
      // Build a simple quiz from the fact
      setQuiz({
        question: `What does "${res.vocabulary?.[0]?.word ?? res.contentMarathi.split(' ')[0]}" mean?`,
        options: [
          res.vocabulary?.[0]?.meaning ?? 'Correct answer',
          'Mountain', 'River', 'Festival',
        ].sort(() => Math.random() - 0.5),
        correct: res.vocabulary?.[0]?.meaning ?? 'Correct answer',
        factId: res.id,
      });
    } finally {
      setLoading(false);
    }
  }

  async function answerQuiz(option: string) {
    if (quizDone) return;
    setQuizAnswer(option);
    setQuizDone(true);
    try {
      const res: any = await funFactsApi.submitQuiz(quiz.factId, option, quiz.correct);
      if (res.isCorrect && res.xpAward > 0) {
        await gamificationApi.awardXp(res.xpAward, 'fun_fact_quiz', `ffquiz-${quiz.factId}-${Date.now()}`).catch(() => null);
      }
    } catch {
      // non-fatal
    }
  }

  function FactCard({ f }: { f: Fact }) {
    return (
      <div style={s.factCard}>
        {f.imageUrl && <img src={f.imageUrl} alt="" style={s.factImg} />}
        <div style={s.categoryChip}>{f.category}</div>
        <p style={s.factMarathi}>{f.contentMarathi}</p>
        <p style={s.factEnglish}>{f.contentEnglish}</p>
        {f.vocabulary?.length ? (
          <div style={s.vocabRow}>
            {f.vocabulary.map((v, i) => (
              <span key={i} style={s.vocabChip}>{v.word} — {v.meaning}</span>
            ))}
          </div>
        ) : null}
        <button
          style={{ ...s.heartBtn, color: favoriteIds.has(f.id) ? '#ef4444' : '#ccc' }}
          onClick={() => toggleFavorite(f.id)}
        >
          {favoriteIds.has(f.id) ? '❤️' : '🤍'} {favoriteIds.has(f.id) ? 'Saved' : 'Save'}
        </button>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/dashboard')}>← Back</button>
        <h2 style={s.title}>Fun Facts</h2>
      </div>

      <div style={s.tabs}>
        {(['browse', 'favorites', 'quiz'] as View[]).map(v => (
          <button
            key={v}
            style={{ ...s.tab, ...(view === v ? s.tabActive : {}) }}
            onClick={() => { if (v === 'quiz') loadQuiz(); else setView(v); }}
          >
            {v === 'browse' ? '💡 Discover' : v === 'favorites' ? '❤️ Saved' : '🧠 Quiz'}
          </button>
        ))}
      </div>

      {view === 'browse' && (
        <>
          {loading ? <div style={s.empty}>Loading...</div> : fact ? <FactCard f={fact} /> : null}
          <button style={s.btnSecondary} onClick={loadRandom}>Next Fact →</button>
        </>
      )}

      {view === 'favorites' && (
        favorites.length === 0
          ? <div style={s.empty}>No saved facts yet. Tap 🤍 to save!</div>
          : favorites.map(f => <FactCard key={f.id} f={f} />)
      )}

      {view === 'quiz' && (
        loading ? <div style={s.empty}>Loading quiz...</div> : quiz ? (
          <div style={s.quizCard}>
            <p style={s.quizLabel}>🧠 Quick Quiz</p>
            <p style={s.quizQuestion}>{quiz.question}</p>
            {quiz.options.map((opt: string) => {
              let style = s.optionBtn;
              if (quizDone) {
                if (opt === quiz.correct) style = { ...s.optionBtn, ...s.optionCorrect };
                else if (opt === quizAnswer) style = { ...s.optionBtn, ...s.optionWrong };
              } else if (quizAnswer === opt) {
                style = { ...s.optionBtn, ...s.optionSelected };
              }
              return (
                <button key={opt} style={style} onClick={() => answerQuiz(opt)} disabled={quizDone}>
                  {opt}
                </button>
              );
            })}
            {quizDone && (
              <div style={s.quizFeedback}>
                {quizAnswer === quiz.correct ? '🎉 Correct! +10 XP' : `❌ The answer was: ${quiz.correct}`}
              </div>
            )}
            {quizDone && <button style={s.btnPrimary} onClick={loadQuiz}>Next Question</button>}
          </div>
        ) : null
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 480, margin: '0 auto', padding: '24px 16px 40px', fontFamily: 'system-ui, sans-serif', background: '#f8f9fa', minHeight: '100vh' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  back: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#FF6B35', fontWeight: 600, padding: 0 },
  title: { flex: 1, fontSize: 20, fontWeight: 700, margin: 0, color: '#1a1a2e' },
  tabs: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: { flex: 1, padding: '8px 4px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#666' },
  tabActive: { background: '#FF6B35', color: '#fff', border: '1px solid #FF6B35' },
  factCard: { background: '#fff', borderRadius: 20, padding: '20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  factImg: { width: '100%', borderRadius: 12, marginBottom: 12, objectFit: 'cover', maxHeight: 160 },
  categoryChip: { display: 'inline-block', background: '#fff3e0', color: '#FF6B35', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, textTransform: 'capitalize', marginBottom: 10 },
  factMarathi: { fontSize: 20, fontWeight: 600, color: '#1a1a2e', margin: '0 0 8px', lineHeight: 1.6 },
  factEnglish: { fontSize: 14, color: '#555', margin: '0 0 12px', lineHeight: 1.6 },
  vocabRow: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  vocabChip: { background: '#f0f9ff', color: '#0369a1', borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 500 },
  heartBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, padding: 0 },
  btnPrimary: { display: 'block', width: '100%', background: '#FF6B35', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 12 },
  btnSecondary: { display: 'block', width: '100%', background: '#fff', color: '#FF6B35', border: '2px solid #FF6B35', borderRadius: 12, padding: '12px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  quizCard: { background: '#fff', borderRadius: 20, padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  quizLabel: { fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', margin: '0 0 8px' },
  quizQuestion: { fontSize: 18, fontWeight: 700, color: '#1a1a2e', margin: '0 0 20px', lineHeight: 1.4 },
  optionBtn: { display: 'block', width: '100%', textAlign: 'left', background: '#f8f9fa', border: '2px solid #e5e7eb', borderRadius: 12, padding: '12px 16px', fontSize: 15, cursor: 'pointer', marginBottom: 10, color: '#333', fontWeight: 500 },
  optionSelected: { background: '#fff3e0', borderColor: '#FF6B35', color: '#FF6B35' },
  optionCorrect: { background: '#dcfce7', borderColor: '#16a34a', color: '#16a34a', fontWeight: 700 },
  optionWrong: { background: '#fee2e2', borderColor: '#dc2626', color: '#dc2626' },
  quizFeedback: { textAlign: 'center', fontSize: 16, fontWeight: 700, padding: '12px', marginBottom: 16, color: '#1a1a2e' },
  empty: { textAlign: 'center', color: '#888', marginTop: 60, fontSize: 16 },
};
