import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { readingApi, gamificationApi } from '../api/client';
import { 
  MicrophoneIcon, 
  StopIcon, 
  HourglassMediumIcon, 
  ArrowLeftIcon, 
  ArrowRightIcon
} from '@phosphor-icons/react';

type Passage = { id: string; title: string; level: string; wordCount: number; estimatedMinutes: number };
type VocabWord = { word: string; meaning: string; transliteration: string; audioUrl?: string };
type Question = { id: string; question: string; type: string; options?: string[]; correctAnswer: string };
type PassageDetail = Passage & { contentMarathi: string; contentEnglish: string; vocabulary: VocabWord[]; questions: Question[] };
type ReadAloudResult = { fluencyScore: number; pronunciationAccuracy: number; wpm: number; xpAward: number; transcribed: string };

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
  const [readAloudResult, setReadAloudResult] = useState<ReadAloudResult | null>(null);
  const [recording, setRecording] = useState(false);
  const [readAloudProcessing, setReadAloudProcessing] = useState(false);
  const [readingProgress, setReadingProgress] = useState<any>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    setLoading(true);
    readingApi.passages(level).then((res: any) => setPassages(res.passages || [])).finally(() => setLoading(false));
  }, [level]);

  useEffect(() => {
    readingApi.progress().then(setReadingProgress).catch(() => null);
  }, []);

  async function openPassage(id: string) {
    setLoading(true);
    try {
      const res: any = await readingApi.passage(id);
      setDetail(res);
      setView('read');
      setAnswers({});
      setQuizResult(null);
      setReadAloudResult(null);
    } finally {
      setLoading(false);
    }
  }

  async function startReadAloud() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(100);
      mediaRef.current = mr;
      startTimeRef.current = Date.now();
      setRecording(true);
    } catch {
      alert('Microphone access denied.');
    }
  }

  async function stopReadAloud() {
    const mr = mediaRef.current;
    if (!mr) return;
    setRecording(false);
    setReadAloudProcessing(true);
    await new Promise<void>(resolve => { mr.onstop = () => resolve(); mr.stop(); });
    mr.stream.getTracks().forEach(t => t.stop());
    const elapsed = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    try {
      const res: any = await readingApi.submitReadAloud(detail!.id, blob, elapsed);
      setReadAloudResult(res);
      if (res.xpAward > 0) {
        await gamificationApi.awardXp(res.xpAward, 'read_aloud', `read-aloud-${detail!.id}-${Date.now()}`).catch(() => null);
      }
    } catch {
      setReadAloudResult({ fluencyScore: 0, pronunciationAccuracy: 0, wpm: 0, xpAward: 0, transcribed: '' });
    } finally {
      setReadAloudProcessing(false);
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
        <button style={s.back} onClick={() => setView('list')}><ArrowLeftIcon size={20} weight="bold" /></button>
        <h2 style={s.title}>{detail.title}</h2>
      </div>
      <div style={s.levelChip}>{detail.level} · {detail.wordCount} words</div>

      {/* Read-aloud section */}
      <div style={s.readAloudCard}>
        <p style={s.readAloudLabel}><MicrophoneIcon size={13} weight="fill" style={{ verticalAlign: 'middle', marginRight: 4 }} />Read Aloud</p>
        {readAloudResult ? (
          <div style={s.readAloudResult}>
            <span style={{ ...s.readAloudScore, color: readAloudResult.fluencyScore >= 60 ? '#16a34a' : '#dc2626' }}>
              {readAloudResult.fluencyScore}/100
            </span>
            <span style={s.readAloudMeta}>{readAloudResult.wpm} WPM · {readAloudResult.pronunciationAccuracy}% accuracy</span>
            {readAloudResult.xpAward > 0 && <span style={s.readAloudXp}>+{readAloudResult.xpAward} XP</span>}
            <button style={s.readAloudBtn} onClick={() => setReadAloudResult(null)}>Try Again</button>
          </div>
        ) : readAloudProcessing ? (
          <div style={s.readAloudProcessing}><HourglassMediumIcon size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Analyzing...</div>
        ) : recording ? (
          <button style={{ ...s.readAloudBtn, background: '#dc2626' }} onClick={stopReadAloud}><StopIcon size={16} weight="fill" style={{ verticalAlign: 'middle', marginRight: 4 }} />Stop Recording</button>
        ) : (
          <button style={s.readAloudBtn} onClick={startReadAloud}><MicrophoneIcon size={16} weight="fill" style={{ verticalAlign: 'middle', marginRight: 4 }} />Start Recording</button>
        )}
      </div>

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
        <button style={s.back} onClick={() => setView('read')}><ArrowLeftIcon size={20} weight="bold" /></button>
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
        <div style={s.resultMsg}>{(quizResult.score ?? 0) >= 70 ? 'Great job!' : 'Keep reading!'}</div>
        <div style={s.xpEarned}>+{(quizResult.score ?? 0) >= 60 ? 50 : 30} XP earned</div>
      </div>
      <button style={s.btnPrimary} onClick={() => setView('list')}>Back to Passages</button>
      <button style={s.btnSecondary} onClick={() => navigate('/dashboard')}>Dashboard</button>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/dashboard')}><ArrowLeftIcon size={20} weight="bold" /></button>
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
            <ArrowRightIcon size={18} color="var(--color-teal)" />
          </div>
        ))
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 480, margin: '0 auto', padding: '52px 24px 48px', fontFamily: 'var(--font-ui)', background: 'var(--color-bg)', minHeight: '100vh' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  back: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--color-slate)', fontWeight: 700, padding: 0, lineHeight: 1 },
  title: { flex: 1, fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--color-slate)' },
  tabs: { display: 'flex', gap: 8, marginBottom: 20 },
  tab: { flex: 1, padding: '9px 4px', borderRadius: 18, border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' },
  tabActive: { background: 'var(--color-teal)', borderColor: 'var(--color-teal)', color: '#fff' },
  // Passage list
  passageRow: { background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: 12, boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', cursor: 'pointer', border: '1px solid var(--color-border)' },
  passageTitle: { fontSize: 16, fontWeight: 700, color: 'var(--color-slate)', marginBottom: 4 },
  passageMeta: { fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'capitalize', margin: 0 },
  // Reading view
  levelChip: { display: 'inline-block', background: 'var(--color-teal-subtle)', color: 'var(--color-teal)', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600, marginBottom: 16, textTransform: 'capitalize' },
  passageCard: { background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: 16, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)' },
  marathiText: { fontFamily: 'var(--font-devanagari)', fontSize: 20, lineHeight: 1.8, color: 'var(--color-text)', margin: '0 0 12px' },
  englishText: { fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0, borderTop: '1px solid var(--color-border)', paddingTop: 12 },
  vocabWord: { background: 'var(--color-teal-subtle)', borderRadius: 4, padding: '0 3px', cursor: 'pointer', textDecoration: 'underline dotted', color: 'var(--color-teal)' },
  vocabSection: { background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: 16, boxShadow: 'var(--shadow-sm)' },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', margin: '0 0 10px', letterSpacing: 0.5 },
  vocabChips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  vocabChip: { background: 'var(--color-teal-subtle)', color: 'var(--color-teal)', border: 'none', borderRadius: 20, padding: '5px 14px', fontSize: 14, cursor: 'pointer', fontWeight: 600 },
  // Vocab popup
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  popupCard: { background: 'var(--color-surface)', borderRadius: 20, padding: '28px 24px', maxWidth: 300, width: '90%', textAlign: 'center' },
  popupWord: { fontFamily: 'var(--font-devanagari)', fontSize: 36, fontWeight: 700, color: 'var(--color-slate)', marginBottom: 6 },
  popupRoman: { fontSize: 16, color: 'var(--color-muted)', marginBottom: 8 },
  popupMeaning: { fontSize: 15, color: 'var(--color-text-secondary)', marginBottom: 20, lineHeight: 1.5 },
  popupClose: { background: 'var(--color-teal)', color: '#fff', border: 'none', borderRadius: 'var(--radius-2xl)', padding: '10px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  // Quiz
  questionCard: { background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: 12, boxShadow: 'var(--shadow-sm)' },
  questionText: { fontSize: 15, fontWeight: 600, color: 'var(--color-slate)', margin: '0 0 12px' },
  optionBtn: { display: 'block', width: '100%', textAlign: 'left', background: 'var(--color-bg)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 14, cursor: 'pointer', marginBottom: 8, color: 'var(--color-text)' },
  optionSelected: { background: 'var(--color-teal-subtle)', borderColor: 'var(--color-teal)', color: 'var(--color-teal)', fontWeight: 600 },
  textInput: { width: '100%', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'var(--color-surface)', color: 'var(--color-text)' },
  // Read aloud
  readAloudCard: { background: 'var(--color-teal-subtle)', border: '1px solid var(--color-teal)', borderRadius: 'var(--radius-lg)', padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  readAloudLabel: { fontSize: 13, fontWeight: 700, color: 'var(--color-teal)', margin: 0, flexShrink: 0 },
  readAloudResult: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 },
  readAloudScore: { fontSize: 20, fontWeight: 800 },
  readAloudMeta: { fontSize: 12, color: 'var(--color-text-secondary)' },
  readAloudXp: { background: 'var(--color-success-subtle)', color: 'var(--color-success)', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 },
  readAloudBtn: { background: 'var(--color-teal)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  readAloudProcessing: { fontSize: 13, color: 'var(--color-teal)', fontStyle: 'italic' },
  // Result screen
  resultHero: { textAlign: 'center', padding: '40px 20px 32px', background: 'var(--color-surface)', borderRadius: 20, marginBottom: 16, boxShadow: 'var(--shadow-md)' },
  resultScore: { fontSize: 72, fontWeight: 800, color: 'var(--color-teal)' },
  resultScoreLabel: { fontSize: 20, color: 'var(--color-muted)', marginBottom: 8 },
  resultMsg: { fontSize: 22, fontWeight: 700, color: 'var(--color-slate)', marginBottom: 8 },
  xpEarned: { fontSize: 16, color: 'var(--color-success)', fontWeight: 600 },
  btnPrimary: { display: 'block', width: '100%', background: 'var(--color-teal)', color: '#fff', border: 'none', borderRadius: 'var(--radius-2xl)', padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 12 },
  btnSecondary: { display: 'block', width: '100%', background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: '14px', fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  empty: { textAlign: 'center', color: 'var(--color-muted)', marginTop: 60, fontSize: 16 },
};
