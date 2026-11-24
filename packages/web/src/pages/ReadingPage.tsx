import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { readingApi, gamificationApi } from '../api/client';

type Passage = { id: string; title: string; level: string; wordCount: number; estimatedMinutes: number };
type VocabWord = { word: string; meaning: string; transliteration: string; audioUrl?: string };
type Question = { id: string; question: string; type: string; options?: string[]; correctAnswer: string };
type PassageDetail = Passage & { contentMarathi: string; contentEnglish: string; vocabulary: VocabWord[]; questions: Question[] };

type View = 'list' | 'read' | 'quiz' | 'result';

export default function ReadingPage() {
  const navigate = useNavigate();
  const [passages, setPassages] = useState<Passage[]>([]);
  const [level, setLevel] = useState('beginner');
  const [view, setView] = useState<View>('list');
  const [detail, setDetail] = useState<PassageDetail | null>(null);
  const [popup, setPopup] = useState<VocabWord | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    readingApi.passages(level).then((res: any) => setPassages(res.passages || [])).finally(() => setLoading(false));
  }, [level]);

  async function openPassage(id: string) {
    setLoading(true);
    try {
      const res: any = await readingApi.passage(id);
      setDetail(res);
      setView('read');
      setAnswers({});
      setQuizResult(null);
    } finally {
      setLoading(false);
    }
  }

  function handleWordTap(word: string) {
    if (!detail) return;
    const vocab = detail.vocabulary?.find(v => v.word === word || detail.contentMarathi.includes(v.word) && word.includes(v.word.slice(0, 2)));
    if (vocab) setPopup(vocab);
  }

  function renderClickableText(text: string) {
    // Split on spaces and punctuation, keep delimiters
    const tokens = text.split(/(\s+|[।,!?])/);
    return tokens.map((token, i) => {
      const isWord = token.trim().length > 0 && !/^[।,!?\s]+$/.test(token);
      const isVocab = isWord && detail?.vocabulary?.some(v => v.word === token || token.startsWith(v.word.slice(0, 2)));
      return (
        <span
          key={i}
          style={isVocab ? s.vocabWord : undefined}
          onClick={isVocab ? () => handleWordTap(token) : undefined}
        >
          {token}
        </span>
      );
    });
  }

  async function submitQuiz() {
    if (!detail) return;
    const answerArr = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }));
    try {
      const res: any = await readingApi.submitComprehension(detail.id, answerArr);
      setQuizResult(res);
      setView('result');
      if (res.score >= 60) {
        await gamificationApi.awardXp(20, 'reading_comprehension', `reading-comp-${detail.id}-${Date.now()}`).catch(() => null);
      }
      await gamificationApi.awardXp(30, 'reading_passage', `reading-passage-${detail.id}-${Date.now()}`).catch(() => null);
    } catch {
      setQuizResult({ score: 0, error: true });
      setView('result');
    }
  }

  const levels = ['beginner', 'intermediate', 'advanced'];

  if (view === 'read' && detail) return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => setView('list')}>← Back</button>
        <h2 style={s.title}>{detail.title}</h2>
      </div>
      <div style={s.levelChip}>{detail.level} · {detail.wordCount} words</div>

      <div style={s.passageCard}>
        <p style={s.marathiText}>{renderClickableText(detail.contentMarathi)}</p>
        <p style={s.englishText}>{detail.contentEnglish}</p>
      </div>

      {detail.vocabulary?.length > 0 && (
        <div style={s.vocabSection}>
          <p style={s.sectionLabel}>Vocabulary</p>
          <div style={s.vocabChips}>
            {detail.vocabulary.map((v, i) => (
              <button key={i} style={s.vocabChip} onClick={() => setPopup(v)}>{v.word}</button>
            ))}
          </div>
        </div>
      )}

      {detail.questions?.length > 0 && (
        <button style={s.btnPrimary} onClick={() => setView('quiz')}>Take Comprehension Quiz →</button>
      )}

      {popup && (
        <div style={s.overlay} onClick={() => setPopup(null)}>
          <div style={s.popupCard} onClick={e => e.stopPropagation()}>
            <div style={s.popupWord}>{popup.word}</div>
            <div style={s.popupRoman}>{popup.transliteration}</div>
            <div style={s.popupMeaning}>{popup.meaning}</div>
            <button style={s.popupClose} onClick={() => setPopup(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );

  if (view === 'quiz' && detail) return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => setView('read')}>← Back</button>
        <h2 style={s.title}>Comprehension Quiz</h2>
      </div>
      {detail.questions.map((q, qi) => (
        <div key={q.id} style={s.questionCard}>
          <p style={s.questionText}>{qi + 1}. {q.question}</p>
          {q.type === 'multiple_choice' && q.options?.map(opt => (
            <button
              key={opt}
              style={{ ...s.optionBtn, ...(answers[q.id] === opt ? s.optionSelected : {}) }}
              onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
            >
              {opt}
            </button>
          ))}
          {(q.type === 'true_false') && ['True', 'False'].map(opt => (
            <button
              key={opt}
              style={{ ...s.optionBtn, ...(answers[q.id] === opt ? s.optionSelected : {}) }}
              onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
            >
              {opt}
            </button>
          ))}
          {q.type === 'short_answer' && (
            <input
              style={s.textInput}
              placeholder="Your answer..."
              value={answers[q.id] || ''}
              onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
            />
          )}
        </div>
      ))}
      <button
        style={{ ...s.btnPrimary, opacity: Object.keys(answers).length < detail.questions.length ? 0.5 : 1 }}
        onClick={submitQuiz}
        disabled={Object.keys(answers).length < detail.questions.length}
      >
        Submit Answers
      </button>
    </div>
  );

  if (view === 'result' && quizResult) return (
    <div style={s.page}>
      <div style={s.resultHero}>
        <div style={s.resultScore}>{quizResult.score ?? 0}</div>
        <div style={s.resultScoreLabel}>/100</div>
        <div style={s.resultMsg}>{(quizResult.score ?? 0) >= 70 ? '🎉 Great job!' : '📖 Keep reading!'}</div>
        <div style={s.xpEarned}>+{(quizResult.score ?? 0) >= 60 ? 50 : 30} XP earned</div>
      </div>
      <button style={s.btnPrimary} onClick={() => setView('list')}>Back to Passages</button>
      <button style={s.btnSecondary} onClick={() => navigate('/dashboard')}>Dashboard</button>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/dashboard')}>← Back</button>
        <h2 style={s.title}>Reading Practice</h2>
      </div>

      <div style={s.tabs}>
        {levels.map(l => (
          <button key={l} style={{ ...s.tab, ...(level === l ? s.tabActive : {}) }} onClick={() => setLevel(l)}>
            {l.charAt(0).toUpperCase() + l.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={s.empty}>Loading passages...</div>
      ) : passages.length === 0 ? (
        <div style={s.empty}>No passages available yet.</div>
      ) : (
        passages.map(p => (
          <div key={p.id} style={s.passageRow} onClick={() => openPassage(p.id)}>
            <div>
              <div style={s.passageTitle}>{p.title}</div>
              <div style={s.passageMeta}>{p.level} · {p.wordCount} words · ~{p.estimatedMinutes} min</div>
            </div>
            <span style={s.arrow}>→</span>
          </div>
        ))
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
  tab: { flex: 1, padding: '8px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#666' },
  tabActive: { background: '#FF6B35', color: '#fff', border: '1px solid #FF6B35' },
  passageRow: { background: '#fff', borderRadius: 14, padding: '16px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', cursor: 'pointer' },
  passageTitle: { fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 },
  passageMeta: { fontSize: 12, color: '#888', textTransform: 'capitalize' },
  arrow: { fontSize: 20, color: '#FF6B35', marginLeft: 'auto' },
  levelChip: { display: 'inline-block', background: '#fff3e0', color: '#FF6B35', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600, marginBottom: 16, textTransform: 'capitalize' },
  passageCard: { background: '#fff', borderRadius: 16, padding: '20px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  marathiText: { fontSize: 20, lineHeight: 1.8, color: '#1a1a2e', margin: '0 0 12px' },
  englishText: { fontSize: 14, color: '#666', lineHeight: 1.6, margin: 0, borderTop: '1px solid #f0f0f0', paddingTop: 12 },
  vocabWord: { background: '#fff3e0', borderRadius: 4, padding: '0 2px', cursor: 'pointer', textDecoration: 'underline dotted', color: '#FF6B35' },
  vocabSection: { background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  sectionLabel: { fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', margin: '0 0 10px' },
  vocabChips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  vocabChip: { background: '#fff3e0', color: '#FF6B35', border: 'none', borderRadius: 20, padding: '5px 14px', fontSize: 14, cursor: 'pointer', fontWeight: 600 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  popupCard: { background: '#fff', borderRadius: 20, padding: '28px 24px', maxWidth: 300, width: '90%', textAlign: 'center' },
  popupWord: { fontSize: 36, fontWeight: 700, color: '#1a1a2e', marginBottom: 6 },
  popupRoman: { fontSize: 16, color: '#888', marginBottom: 8 },
  popupMeaning: { fontSize: 15, color: '#444', marginBottom: 20, lineHeight: 1.5 },
  popupClose: { background: '#FF6B35', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  questionCard: { background: '#fff', borderRadius: 14, padding: '16px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  questionText: { fontSize: 15, fontWeight: 600, color: '#1a1a2e', margin: '0 0 12px' },
  optionBtn: { display: 'block', width: '100%', textAlign: 'left', background: '#f8f9fa', border: '2px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: 14, cursor: 'pointer', marginBottom: 8, color: '#333' },
  optionSelected: { background: '#fff3e0', borderColor: '#FF6B35', color: '#FF6B35', fontWeight: 600 },
  textInput: { width: '100%', border: '2px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  resultHero: { textAlign: 'center', padding: '40px 20px 32px', background: '#fff', borderRadius: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  resultScore: { fontSize: 72, fontWeight: 800, color: '#FF6B35' },
  resultScoreLabel: { fontSize: 20, color: '#888', marginBottom: 8 },
  resultMsg: { fontSize: 22, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 },
  xpEarned: { fontSize: 16, color: '#16a34a', fontWeight: 600 },
  btnPrimary: { display: 'block', width: '100%', background: '#FF6B35', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 12 },
  btnSecondary: { display: 'block', width: '100%', background: '#f0f0f0', color: '#333', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  empty: { textAlign: 'center', color: '#888', marginTop: 60, fontSize: 16 },
};
