import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lessonsApi, progressApi, quizzesApi, gamificationApi } from '../api/client';
import TransitionOverlay from '../components/TransitionOverlay';

type Step = 'intro' | 'phrases' | 'quiz' | 'complete';

export default function LessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<any>(null);
  const [step, setStep] = useState<Step>('intro');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [overlay, setOverlay] = useState<{ xp: number; score: number } | null>(null);

  useEffect(() => {
    if (!id) return;
    lessonsApi.get(id).then(setLesson).finally(() => setLoading(false));
    progressApi.save(id, 'in_progress');
  }, [id]);

  const handleQuizSubmit = async () => {
    if (!lesson) return;
    setSubmitting(true);
    try {
      const answers = lesson.quizQuestions.map((q: any) => ({
        questionId: q.id,
        answer: quizAnswers[q.id] ?? '',
        timeTakenMs: 5000,
      }));
      const result = await quizzesApi.submit(lesson.id, answers, `quiz_${lesson.id}`);
      setQuizResult(result);

      // Award XP
      const earnedXp = 50 + ((result as any).quizXp ?? 0);
      await gamificationApi.awardXp(earnedXp, 'lesson', `lesson_${lesson.id}`);
      await gamificationApi.recordActivity();
      await progressApi.save(lesson.id, 'completed', (result as any).score ?? 0);
      setOverlay({ xp: earnedXp, score: (result as any).score ?? 0 });
      setStep('complete');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading lesson...</div>;
  if (!lesson) return <div style={styles.loading}>Lesson not found</div>;

  const phrases = lesson.phrases ?? [];
  const questions = lesson.quizQuestions ?? [];
  const currentPhrase = phrases[phraseIdx];

  return (
    <div style={styles.page}>
      {/* Progress bar */}
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: step === 'intro' ? '10%' : step === 'phrases' ? `${((phraseIdx + 1) / phrases.length) * 50}%` : step === 'quiz' ? '80%' : '100%' }} />
      </div>

      {/* INTRO */}
      {step === 'intro' && (
        <div style={styles.stepContainer}>
          <h2 style={styles.lessonTitle}>{lesson.title}</h2>
          <p style={styles.lessonMarathi}>{lesson.titleMarathi}</p>
          <div style={styles.infoRow}>
            <span style={styles.infoBadge}>{lesson.level}</span>
            <span style={styles.infoBadge}>{lesson.topic}</span>
            <span style={styles.infoBadge}>⏱ {lesson.estimatedMinutes} min</span>
          </div>
          <p style={styles.infoText}>You'll learn {phrases.length} phrases and complete a quiz.</p>
          <button style={styles.primaryBtn} onClick={() => setStep('phrases')}>Start Lesson →</button>
          <button style={styles.backLink} onClick={() => navigate('/lessons')}>← Back to Lessons</button>
        </div>
      )}

      {/* PHRASES */}
      {step === 'phrases' && currentPhrase && (
        <div style={styles.stepContainer}>
          <p style={styles.stepLabel}>Phrase {phraseIdx + 1} of {phrases.length}</p>
          <div style={styles.phraseCard}>
            <p style={styles.marathiText}>{currentPhrase.marathiText}</p>
            <p style={styles.transliteration}>{currentPhrase.transliteration}</p>
            <p style={styles.englishMeaning}>{currentPhrase.englishMeaning}</p>
            {currentPhrase.audioUrl && (
              <button style={styles.audioBtn} onClick={() => new Audio(currentPhrase.audioUrl).play()}>
                🔊 Listen
              </button>
            )}
          </div>
          <div style={styles.navRow}>
            {phraseIdx > 0 && <button style={styles.secondaryBtn} onClick={() => setPhraseIdx(i => i - 1)}>← Prev</button>}
            {phraseIdx < phrases.length - 1
              ? <button style={styles.primaryBtn} onClick={() => setPhraseIdx(i => i + 1)}>Next →</button>
              : <button style={styles.primaryBtn} onClick={() => setStep('quiz')}>Take Quiz →</button>
            }
          </div>
        </div>
      )}

      {/* QUIZ */}
      {step === 'quiz' && (
        <div style={styles.stepContainer}>
          <h3 style={styles.quizTitle}>Quiz Time! 🎯</h3>
          {questions.map((q: any) => (
            <div key={q.id} style={styles.questionCard}>
              <p style={styles.questionText}>{q.questionText}</p>
              {q.type === 'multiple_choice' && Array.isArray(q.options) && (
                <div style={styles.options}>
                  {q.options.map((opt: string) => (
                    <button
                      key={opt}
                      style={{ ...styles.optionBtn, ...(quizAnswers[q.id] === opt ? styles.optionSelected : {}) }}
                      onClick={() => setQuizAnswers(a => ({ ...a, [q.id]: opt }))}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
              {q.type === 'fill_blank' && (
                <input
                  style={styles.fillInput}
                  placeholder="Type your answer..."
                  value={quizAnswers[q.id] ?? ''}
                  onChange={e => setQuizAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                />
              )}
            </div>
          ))}
          <button style={styles.primaryBtn} onClick={handleQuizSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>
      )}

      {/* COMPLETE */}
      {step === 'complete' && (
        <div style={{ ...styles.stepContainer, textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: 'var(--color-text-muted)' }}>Great work! Your results are saved.</p>
          <button style={styles.primaryBtn} onClick={() => navigate('/lessons')}>Next Lesson →</button>
          <button style={styles.backLink} onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
        </div>
      )}

      {overlay && (
        <TransitionOverlay
          variant="lesson-complete"
          score={overlay.score}
          xp={overlay.xp}
          onDismiss={() => setOverlay(null)}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 480, margin: '0 auto', fontFamily: 'var(--font-sans)', background: 'var(--color-bg)', minHeight: '100vh' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 18, color: 'var(--color-text-muted)' },
  progressBar: { height: 4, background: 'var(--color-border)', position: 'sticky', top: 0, zIndex: 10 },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, var(--color-teal), var(--color-teal-light))', transition: 'width 0.4s ease' },
  stepContainer: { padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 16 },
  lessonTitle: { fontSize: 28, fontWeight: 800, color: 'var(--color-slate)', margin: 0 },
  lessonMarathi: { fontSize: 22, color: 'var(--color-teal)', fontWeight: 600, margin: 0, fontFamily: 'var(--font-devanagari)' },
  infoRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  infoBadge: { background: 'var(--color-border)', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'capitalize' },
  infoText: { color: 'var(--color-text-muted)', fontSize: 15, margin: 0 },
  stepLabel: { fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600, margin: 0 },
  phraseCard: { background: 'var(--color-surface)', borderRadius: 20, padding: '28px 24px', textAlign: 'center', boxShadow: 'var(--shadow-md)' },
  marathiText: { fontSize: 32, fontWeight: 800, color: 'var(--color-slate)', margin: '0 0 8px', lineHeight: 1.4, fontFamily: 'var(--font-devanagari)' },
  transliteration: { fontSize: 18, color: 'var(--color-teal)', fontWeight: 600, margin: '0 0 8px' },
  englishMeaning: { fontSize: 16, color: 'var(--color-text-muted)', margin: '0 0 16px' },
  audioBtn: { background: 'var(--color-teal-subtle)', border: 'none', borderRadius: 20, padding: '8px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--color-teal)' },
  navRow: { display: 'flex', gap: 12, justifyContent: 'flex-end' },
  primaryBtn: { background: 'var(--color-teal)', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 28px', fontSize: 16, fontWeight: 700, cursor: 'pointer' },
  secondaryBtn: { background: 'var(--color-border)', color: 'var(--color-text)', border: 'none', borderRadius: 14, padding: '14px 28px', fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  backLink: { background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 14, textAlign: 'center' },
  quizTitle: { fontSize: 22, fontWeight: 800, color: 'var(--color-slate)', margin: 0 },
  questionCard: { background: 'var(--color-surface)', borderRadius: 16, padding: '16px 20px', boxShadow: 'var(--shadow-sm)' },
  questionText: { fontSize: 16, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 12px' },
  options: { display: 'flex', flexDirection: 'column', gap: 8 },
  optionBtn: { padding: '12px 16px', borderRadius: 12, border: '2px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer', fontSize: 15, textAlign: 'left', transition: 'all 0.15s' },
  optionSelected: { border: '2px solid var(--color-teal)', background: 'var(--color-teal-subtle)', color: 'var(--color-teal)', fontWeight: 600 },
  fillInput: { width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid var(--color-border)', fontSize: 15, outline: 'none', boxSizing: 'border-box', background: 'var(--color-bg)', color: 'var(--color-text)' },
};
