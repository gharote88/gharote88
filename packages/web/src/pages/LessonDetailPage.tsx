import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lessonsApi, progressApi, quizzesApi, gamificationApi } from '../api/client';

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
      await gamificationApi.awardXp(50 + result.quizXp, 'lesson', `lesson_${lesson.id}`);
      await gamificationApi.recordActivity();
      await progressApi.save(lesson.id, 'completed', result.score);
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
      {step === 'complete' && quizResult && (
        <div style={{ ...styles.stepContainer, textAlign: 'center' }}>
          <div style={styles.celebrationEmoji}>🎉</div>
          <h2 style={styles.completeTitle}>Lesson Complete!</h2>
          <div style={styles.scoreCircle}>
            <span style={styles.scoreNum}>{quizResult.score}%</span>
            <span style={styles.scoreLabel}>Quiz Score</span>
          </div>
          <div style={styles.xpBadge}>+{50 + quizResult.quizXp} XP earned!</div>
          <button style={styles.primaryBtn} onClick={() => navigate('/lessons')}>Next Lesson →</button>
          <button style={styles.backLink} onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 480, margin: '0 auto', fontFamily: 'system-ui, sans-serif', background: '#f8f9fa', minHeight: '100vh' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 18, color: '#666' },
  progressBar: { height: 4, background: '#e0e0e0', position: 'sticky', top: 0, zIndex: 10 },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #FF6B35, #F7931E)', transition: 'width 0.4s ease' },
  stepContainer: { padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 16 },
  lessonTitle: { fontSize: 28, fontWeight: 800, color: '#1a1a2e', margin: 0 },
  lessonMarathi: { fontSize: 22, color: '#FF6B35', fontWeight: 600, margin: 0 },
  infoRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  infoBadge: { background: '#f0f0f0', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#666', textTransform: 'capitalize' },
  infoText: { color: '#666', fontSize: 15, margin: 0 },
  stepLabel: { fontSize: 13, color: '#888', fontWeight: 600, margin: 0 },
  phraseCard: { background: '#fff', borderRadius: 20, padding: '28px 24px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
  marathiText: { fontSize: 32, fontWeight: 800, color: '#1a1a2e', margin: '0 0 8px', lineHeight: 1.4 },
  transliteration: { fontSize: 18, color: '#FF6B35', fontWeight: 600, margin: '0 0 8px' },
  englishMeaning: { fontSize: 16, color: '#666', margin: '0 0 16px' },
  audioBtn: { background: '#f0f0f0', border: 'none', borderRadius: 20, padding: '8px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  navRow: { display: 'flex', gap: 12, justifyContent: 'flex-end' },
  primaryBtn: { background: '#FF6B35', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 28px', fontSize: 16, fontWeight: 700, cursor: 'pointer' },
  secondaryBtn: { background: '#f0f0f0', color: '#333', border: 'none', borderRadius: 14, padding: '14px 28px', fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  backLink: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14, textAlign: 'center' },
  quizTitle: { fontSize: 22, fontWeight: 800, color: '#1a1a2e', margin: 0 },
  questionCard: { background: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  questionText: { fontSize: 16, fontWeight: 600, color: '#1a1a2e', margin: '0 0 12px' },
  options: { display: 'flex', flexDirection: 'column', gap: 8 },
  optionBtn: { padding: '12px 16px', borderRadius: 12, border: '2px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontSize: 15, textAlign: 'left', transition: 'all 0.15s' },
  optionSelected: { border: '2px solid #FF6B35', background: '#fff5f0', color: '#FF6B35', fontWeight: 600 },
  fillInput: { width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid #e0e0e0', fontSize: 15, outline: 'none', boxSizing: 'border-box' },
  celebrationEmoji: { fontSize: 64 },
  completeTitle: { fontSize: 28, fontWeight: 800, color: '#1a1a2e', margin: 0 },
  scoreCircle: { width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg, #FF6B35, #F7931E)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: '#fff' },
  scoreNum: { fontSize: 28, fontWeight: 800 },
  scoreLabel: { fontSize: 12, opacity: 0.9 },
  xpBadge: { background: '#fff3cd', color: '#856404', borderRadius: 20, padding: '8px 20px', fontWeight: 700, fontSize: 16, display: 'inline-block' },
};
