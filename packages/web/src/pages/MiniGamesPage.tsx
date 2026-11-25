import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { miniGamesApi, gamificationApi, type ApiResponse } from '../api/client';

const GAME_TYPES = [
  { type: 'word_match',  icon: '🔤', label: 'Word Match',    desc: 'Match Marathi words to their meanings' },
  { type: 'fill_blank',  icon: '✏️', label: 'Fill the Blank', desc: 'Complete the Marathi sentence' },
  { type: 'translation', icon: '🔄', label: 'Translation',   desc: 'Translate between Marathi and English' },
] as const;

type GameType = typeof GAME_TYPES[number]['type'];
type GameState = 'menu' | 'playing' | 'result';

type Question = {
  question?: string;
  prompt?: string;
  marathiText?: string;
  options?: string[];
  answer?: string;
  correctAnswer?: string;
};

type GameData = {
  id: string;
  questions?: Question[];
  items?: Question[];
};

type GameResult = {
  score: number;
  correct: number;
  total: number;
  xpEarned: number;
};

/** Narrow an ApiResponse into GameData, throwing if the shape is invalid. */
function parseGameData(raw: ApiResponse): GameData {
  if (typeof raw.id !== 'string') throw new Error('Invalid game data: missing id');
  const toQuestions = (val: unknown): Question[] =>
    Array.isArray(val) ? (val as Question[]) : [];
  return {
    id: raw.id,
    questions: toQuestions(raw.questions),
    items: toQuestions(raw.items),
  };
}

/** Safely extract xpEarned as a number from an ApiResponse. */
function extractXpEarned(raw: ApiResponse): number {
  return typeof raw.xpEarned === 'number' ? raw.xpEarned : 0;
}

export default function MiniGamesPage() {
  const navigate = useNavigate();
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [state, setState] = useState<GameState>('menu');
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<GameResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadGame(type: GameType) {
    setLoading(true);
    setAnswers({});
    setResult(null);
    try {
      const data = await miniGamesApi.get(type, 'beginner');
      setGameData(parseGameData(data));
      setGameType(type);
      setState('playing');
    } catch {
      alert('No game available for this type yet.');
    } finally {
      setLoading(false);
    }
  }

  async function submitGame() {
    if (!gameData) return;
    setSubmitting(true);
    try {
      const questions: Question[] = gameData.questions ?? gameData.items ?? [];
      let correct = 0;
      questions.forEach((q: Question, i: number) => {
        const userAns = (answers[i] ?? '').trim().toLowerCase();
        const correctAns = (q.answer ?? q.correctAnswer ?? '').trim().toLowerCase();
        if (userAns === correctAns) correct++;
      });
      const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
      const res = await miniGamesApi.submit(gameData.id, score, `mini-${gameData.id}-${Date.now()}`);
      const xpEarned = extractXpEarned(res);
      if (xpEarned > 0) {
        await gamificationApi.awardXp(xpEarned, 'mini_game', `mini-xp-${gameData.id}-${Date.now()}`).catch(() => null);
      }
      setResult({ score, correct, total: questions.length, xpEarned });
      setState('result');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Menu ─────────────────────────────────────────────────────────────────────
  if (state === 'menu') return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/dashboard')}>← Back</button>
        <h2 style={s.title}>Mini Games</h2>
      </div>
      <p style={s.subtitle}>Quick games to reinforce your Marathi skills</p>
      {GAME_TYPES.map(g => (
        <div key={g.type} style={s.gameCard} onClick={() => !loading && loadGame(g.type)}>
          <span style={s.gameIcon}>{g.icon}</span>
          <div style={s.gameInfo}>
            <div style={s.gameLabel}>{g.label}</div>
            <div style={s.gameDesc}>{g.desc}</div>
          </div>
          <span style={s.gameArrow}>{loading ? '...' : '→'}</span>
        </div>
      ))}
    </div>
  );

  // ── Result ───────────────────────────────────────────────────────────────────
  if (state === 'result' && result) return (
    <div style={s.page}>
      <div style={s.resultHero}>
        <div style={s.resultEmoji}>{result.score >= 80 ? '🎉' : result.score >= 50 ? '👍' : '🔄'}</div>
        <div style={s.resultScore}>{result.score}</div>
        <div style={s.resultScoreLabel}>/100</div>
        <div style={s.resultDetail}>{result.correct}/{result.total} correct</div>
        {result.xpEarned > 0 && <div style={s.xpBadge}>+{result.xpEarned} XP</div>}
      </div>
      <button style={s.btnPrimary} onClick={() => gameType && loadGame(gameType)}>Play Again</button>
      <button style={s.btnSecondary} onClick={() => setState('menu')}>Choose Game</button>
      <button style={s.btnSecondary} onClick={() => navigate('/dashboard')}>Dashboard</button>
    </div>
  );

  // ── Playing ──────────────────────────────────────────────────────────────────
  const questions: Question[] = gameData?.questions ?? gameData?.items ?? [];
  const meta = GAME_TYPES.find(g => g.type === gameType);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => setState('menu')}>← Games</button>
        <h2 style={s.title}>{meta?.icon} {meta?.label}</h2>
        <span style={s.counter}>{Object.keys(answers).length}/{questions.length}</span>
      </div>

      {questions.length === 0 ? (
        <div style={s.empty}>No questions available for this game.</div>
      ) : (
        questions.map((q: Question, i: number) => (
          <div key={i} style={s.questionCard}>
            <p style={s.questionText}>{i + 1}. {q.question ?? q.prompt ?? q.marathiText}</p>

            {/* Multiple choice */}
            {Array.isArray(q.options) && (
              <div style={s.options}>
                {q.options.map((opt: string) => (
                  <button
                    key={opt}
                    style={{ ...s.optionBtn, ...(answers[i] === opt ? s.optionSelected : {}) }}
                    onClick={() => setAnswers(a => ({ ...a, [i]: opt }))}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* Text input (fill_blank / translation) */}
            {!Array.isArray(q.options) && (
              <input
                style={s.textInput}
                placeholder="Type your answer..."
                value={answers[i] ?? ''}
                onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))}
              />
            )}
          </div>
        ))
      )}

      {questions.length > 0 && (
        <button
          style={{ ...s.btnPrimary, opacity: Object.keys(answers).length < questions.length ? 0.5 : 1 }}
          onClick={submitGame}
          disabled={submitting || Object.keys(answers).length < questions.length}
        >
          {submitting ? 'Checking...' : 'Submit Answers'}
        </button>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 480, margin: '0 auto', padding: '24px 16px 40px', fontFamily: 'system-ui, sans-serif', background: '#f8f9fa', minHeight: '100vh' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 },
  back: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#FF6B35', fontWeight: 600, padding: 0 },
  title: { flex: 1, fontSize: 20, fontWeight: 700, margin: 0, color: '#1a1a2e' },
  counter: { fontSize: 13, color: '#888' },
  subtitle: { fontSize: 14, color: '#888', margin: '0 0 20px' },
  gameCard: { background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer' },
  gameIcon: { fontSize: 32, flexShrink: 0 },
  gameInfo: { flex: 1 },
  gameLabel: { fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 2 },
  gameDesc: { fontSize: 13, color: '#888' },
  gameArrow: { fontSize: 20, color: '#FF6B35' },
  questionCard: { background: '#fff', borderRadius: 14, padding: '16px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  questionText: { fontSize: 16, fontWeight: 600, color: '#1a1a2e', margin: '0 0 12px', lineHeight: 1.5 },
  options: { display: 'flex', flexDirection: 'column', gap: 8 },
  optionBtn: { padding: '11px 14px', borderRadius: 10, border: '2px solid #e5e7eb', background: '#f8f9fa', cursor: 'pointer', fontSize: 14, textAlign: 'left', color: '#333', transition: 'all 0.15s' },
  optionSelected: { border: '2px solid #FF6B35', background: '#fff5f0', color: '#FF6B35', fontWeight: 600 },
  textInput: { width: '100%', border: '2px solid #e5e7eb', borderRadius: 10, padding: '11px 14px', fontSize: 15, outline: 'none', boxSizing: 'border-box' },
  btnPrimary: { display: 'block', width: '100%', background: '#FF6B35', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 10 },
  btnSecondary: { display: 'block', width: '100%', background: '#f0f0f0', color: '#333', border: 'none', borderRadius: 12, padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 10 },
  resultHero: { background: '#fff', borderRadius: 20, padding: '32px 24px', textAlign: 'center', marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
  resultEmoji: { fontSize: 56, marginBottom: 8 },
  resultScore: { fontSize: 64, fontWeight: 800, color: '#FF6B35', lineHeight: 1 },
  resultScoreLabel: { fontSize: 20, color: '#aaa', marginBottom: 6 },
  resultDetail: { fontSize: 16, color: '#555', marginBottom: 10 },
  xpBadge: { display: 'inline-block', background: '#dcfce7', color: '#16a34a', borderRadius: 20, padding: '6px 18px', fontSize: 15, fontWeight: 700 },
  empty: { textAlign: 'center', color: '#888', marginTop: 60, fontSize: 16 },
};
