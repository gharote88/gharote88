import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { speechApi, gamificationApi, lessonsApi } from '../api/client';
import { MicrophoneIcon, SpeakerHighIcon, StopIcon, ArrowCounterClockwiseIcon, ArrowLeftIcon } from '@phosphor-icons/react';

type Phrase = { id: string; marathiText: string; transliteration: string; englishMeaning: string; audioUrl?: string };
type AttemptState = 'idle' | 'listening' | 'recording' | 'processing' | 'result' | 'confirm';

const SCORE_LABELS: [number, string, string][] = [
  [90, '⭐ Excellent!', '#16a34a'],
  [70, '👍 Good', '#65a30d'],
  [50, '🙂 Fair', '#d97706'],
  [0,  '🔄 Keep trying', '#dc2626'],
];

function scoreLabel(score: number): [string, string] {
  for (const [min, label, color] of SCORE_LABELS) {
    if (score >= min) return [label, color];
  }
  return ['🔄 Keep trying', '#dc2626'];
}

export default function SpeakingPage() {
  const navigate = useNavigate();
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  // Per-phrase state
  const [state, setState] = useState<AttemptState>('idle');
  const [attempt, setAttempt] = useState(1);
  const [result, setResult] = useState<any>(null);
  const [pendingTranscription, setPendingTranscription] = useState('');
  const [scores, setScores] = useState<number[]>([]); // one per phrase
  const [totalXp, setTotalXp] = useState(0);
  const [done, setDone] = useState(false);

  // Audio / waveform
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Load beginner lesson phrases as speaking exercises
    lessonsApi.list('beginner', 1).then((res: any) => {
      const lessons = res.lessons ?? [];
      if (lessons.length > 0) {
        return lessonsApi.get(lessons[0].id);
      }
      return null;
    }).then((lesson: any) => {
      if (lesson?.phrases?.length) setPhrases(lesson.phrases);
    }).finally(() => setLoading(false));

    return () => {
      cancelAnimationFrame(animRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Waveform animation
  function drawWaveform() {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d')!;
    const buf = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(buf);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#FF6B35';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const sliceW = canvas.width / buf.length;
    let x = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = buf[i] / 128;
      const y = (v * canvas.height) / 2;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      x += sliceW;
    }
    ctx.stroke();
    animRef.current = requestAnimationFrame(drawWaveform);
  }

  function drawFlatLine() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.start(100);
      mediaRef.current = mr;

      setState('recording');
      drawWaveform();
    } catch {
      alert('Microphone access denied. Please allow microphone access to use speaking practice.');
    }
  }

  async function stopRecording() {
    cancelAnimationFrame(animRef.current);
    drawFlatLine();
    setState('processing');

    const mr = mediaRef.current;
    if (!mr) return;

    await new Promise<void>(resolve => {
      mr.onstop = () => resolve();
      mr.stop();
    });
    streamRef.current?.getTracks().forEach(t => t.stop());

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const phrase = phrases[idx];

    try {
      const res: any = await speechApi.evaluate(blob, phrase.marathiText, attempt, `speech-${phrase.id}-${attempt}`);

      if (res.needsConfirmation) {
        setPendingTranscription(res.transcribed);
        setState('confirm');
        return;
      }

      setResult(res);
      setState('result');
      if (res.xpAward > 0) {
        setTotalXp(x => x + res.xpAward);
        await gamificationApi.awardXp(res.xpAward, 'speaking', `speech-xp-${phrase.id}-${attempt}-${Date.now()}`).catch(() => null);
      }
    } catch {
      setResult({ score: 0, canSkip: attempt >= 3 });
      setState('result');
    }
  }

  function confirmTranscription(confirmed: boolean) {
    if (confirmed) {
      // Treat confirmed transcription as the result
      const phrase = phrases[idx];
      const score = pendingTranscription.trim() === phrase.marathiText.trim() ? 85 : 40;
      setResult({ score, xpAward: score >= 70 ? 20 : 0, transcribed: pendingTranscription });
      setState('result');
    } else {
      // Retry
      setAttempt(a => a + 1);
      setState('idle');
    }
  }

  function retry() {
    setAttempt(a => a + 1);
    setResult(null);
    setState('idle');
  }

  function nextPhrase() {
    setScores(s => [...s, result?.score ?? 0]);
    setResult(null);
    setAttempt(1);
    setState('idle');
    if (idx + 1 >= phrases.length) {
      setDone(true);
    } else {
      setIdx(i => i + 1);
    }
  }

  function skip() {
    setScores(s => [...s, 0]);
    setResult(null);
    setAttempt(1);
    setState('idle');
    if (idx + 1 >= phrases.length) setDone(true);
    else setIdx(i => i + 1);
  }

  const phrase = phrases[idx];
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  if (loading) return <div style={s.loading}>Loading phrases...</div>;

  if (done) return (
    <div style={s.page}>
      <div style={s.doneHero}>
        <div style={s.doneEmoji}><MicrophoneIcon size={56} weight="duotone" color="var(--color-teal)" /></div>
        <h2 style={s.doneTitle}>Practice Complete!</h2>
        <div style={s.doneScore}>{avgScore}%</div>
        <div style={s.doneScoreLabel}>Average Score</div>
        <div style={s.xpBadge}>+{totalXp} XP earned</div>
      </div>
      <div style={s.scoreBreakdown}>
        {scores.map((sc, i) => {
          const [lbl, color] = scoreLabel(sc);
          return (
            <div key={i} style={s.scoreRow}>
              <span style={s.scorePhrase}>{phrases[i]?.marathiText ?? `Phrase ${i + 1}`}</span>
              <span style={{ ...s.scorePill, background: color }}>{sc}</span>
              <span style={{ fontSize: 13, color }}>{lbl}</span>
            </div>
          );
        })}
      </div>
      <button style={s.btnPrimary} onClick={() => navigate('/lessons')}>Back to Lessons</button>
      <button style={s.btnSecondary} onClick={() => navigate('/dashboard')}>Dashboard</button>
    </div>
  );

  if (!phrase) return <div style={s.loading}>No phrases available.</div>;

  const [lbl, lcolor] = result ? scoreLabel(result.score) : ['', ''];

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/lessons')}><ArrowLeftIcon size={20} weight="bold" /></button>
        <h2 style={s.title}>Speaking Practice</h2>
        <span style={s.counter}>{idx + 1}/{phrases.length}</span>
      </div>

      {/* Progress dots */}
      <div style={s.dots}>
        {phrases.map((_, i) => (
          <div key={i} style={{ ...s.dot, ...(i < idx ? s.dotDone : i === idx ? s.dotCurrent : {}) }} />
        ))}
      </div>

      {/* Phrase card */}
      <div style={s.phraseCard}>
        <p style={s.marathiText}>{phrase.marathiText}</p>
        <p style={s.roman}>{phrase.transliteration}</p>
        <p style={s.english}>{phrase.englishMeaning}</p>
        {phrase.audioUrl && (
          <button style={s.listenBtn} onClick={() => new Audio(phrase.audioUrl).play()}>
            
          </button>
        )}
      </div>

      {/* Attempt indicator */}
      <div style={s.attemptRow}>
        {[1, 2, 3].map(n => (
          <div key={n} style={{ ...s.attemptDot, ...(n <= attempt ? s.attemptDotActive : {}) }} />
        ))}
        <span style={s.attemptLabel}>Attempt {attempt}/3</span>
      </div>

      {/* Waveform */}
      <canvas
        ref={canvasRef}
        width={400}
        height={80}
        style={s.waveform}
      />

      {/* State: idle */}
      {state === 'idle' && (
        <div style={s.controls}>
          <button style={s.recordBtn} onClick={startRecording}>
            <MicrophoneIcon size={22} weight="fill" style={{ verticalAlign: 'middle', marginRight: 6 }} />Tap to Record
          </button>
          {attempt > 1 && (
            <button style={s.skipBtn} onClick={skip}>Skip</button>
          )}
        </div>
      )}

      {/* State: recording */}
      {state === 'recording' && (
        <div style={s.controls}>
          <button style={{ ...s.recordBtn, ...s.recordBtnActive }} onClick={stopRecording}>
            <StopIcon size={22} weight="fill" style={{ verticalAlign: 'middle', marginRight: 6 }} />Stop Recording
          </button>
        </div>
      )}

      {/* State: processing */}
      {state === 'processing' && (
        <div style={s.processingRow}>
          <div style={s.spinner} />
          <span style={s.processingText}>Analyzing pronunciation...</span>
        </div>
      )}

      {/* State: confirm low-confidence */}
      {state === 'confirm' && (
        <div style={s.confirmCard}>
          <p style={s.confirmLabel}>We heard:</p>
          <p style={s.confirmText}>"{pendingTranscription}"</p>
          <p style={s.confirmSub}>Is this what you said?</p>
          <div style={s.confirmBtns}>
            <button style={s.btnYes} onClick={() => confirmTranscription(true)}>✓ Yes</button>
            <button style={s.btnNo} onClick={() => confirmTranscription(false)}>✗ Try Again</button>
          </div>
        </div>
      )}

      {/* State: result */}
      {state === 'result' && result && (
        <div style={s.resultCard}>
          <div style={s.resultScoreRow}>
            <span style={{ ...s.resultScore, color: lcolor }}>{result.score}</span>
            <span style={s.resultScoreMax}>/100</span>
            <span style={{ ...s.resultLabel, color: lcolor }}>{lbl}</span>
          </div>
          {result.transcribed && (
            <p style={s.transcribedText}>We heard: "{result.transcribed}"</p>
          )}
          {result.xpAward > 0 && (
            <div style={s.xpEarned}>+{result.xpAward} XP</div>
          )}
          <div style={s.resultBtns}>
            {!result.canSkip && attempt < 3 && result.score < 80 && (
              <button style={s.btnSecondary} onClick={retry}><ArrowCounterClockwiseIcon size={16} weight="bold" style={{ verticalAlign: 'middle', marginRight: 4 }} />Retry</button>
            )}
            <button style={s.btnPrimary} onClick={nextPhrase}>
              {idx + 1 >= phrases.length ? 'Finish' : 'Next →'}
            </button>
          </div>
          {result.canSkip && (
            <button style={s.skipBtn} onClick={skip}>Skip this phrase</button>
          )}
        </div>
      )}

      {/* Phonetic tips */}
      <div style={s.tipCard}>
        <p style={s.tipLabel}>Pronunciation tip</p>
        <p style={s.tipText}>Speak clearly and at a natural pace. Marathi vowels are distinct — pay attention to long vs short sounds.</p>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 480, margin: '0 auto', padding: '52px 24px 48px', fontFamily: 'var(--font-ui)', background: 'var(--color-bg)', minHeight: '100vh' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 16, color: 'var(--color-muted)', fontFamily: 'var(--font-ui)' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  back: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--color-slate)', fontWeight: 700, padding: 0, lineHeight: 1 },
  title: { flex: 1, fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--color-slate)' },
  counter: { fontSize: 13, fontWeight: 600, color: 'var(--color-teal)' },
  // Progress dots
  dots: { display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' },
  dot: { width: 8, height: 8, borderRadius: '50%', background: 'var(--color-border)' },
  dotDone: { background: 'var(--color-success)' },
  dotCurrent: { background: 'var(--color-saffron)', width: 20, borderRadius: 4 },
  // Phrase card
  phraseCard: { background: 'var(--color-surface)', borderRadius: 20, padding: '28px 24px', marginBottom: 16, textAlign: 'center', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)' },
  marathiText: { fontFamily: 'var(--font-devanagari)', fontSize: 36, fontWeight: 800, color: 'var(--color-slate)', margin: '0 0 8px', lineHeight: 1.4 },
  roman: { fontSize: 18, color: 'var(--color-teal)', fontWeight: 600, margin: '0 0 6px' },
  english: { fontSize: 15, color: 'var(--color-text-secondary)', margin: '0 0 16px' },
  listenBtn: { background: 'var(--color-teal-subtle)', border: 'none', borderRadius: 20, padding: '8px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--color-teal)' },
  // Attempt indicator
  attemptRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 },
  attemptDot: { width: 10, height: 10, borderRadius: '50%', background: 'var(--color-border)' },
  attemptDotActive: { background: 'var(--color-saffron)' },
  attemptLabel: { fontSize: 12, color: 'var(--color-muted)', marginLeft: 4 },
  // Waveform
  waveform: { display: 'block', width: '100%', height: 64, background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', marginBottom: 16, border: '1px solid var(--color-border)' },
  // Mic controls
  controls: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 16 },
  recordBtn: { width: '100%', background: 'var(--color-saffron)', color: '#fff', border: 'none', borderRadius: 'var(--radius-2xl)', padding: '18px', fontSize: 18, fontWeight: 700, cursor: 'pointer' },
  recordBtnActive: { background: 'var(--color-error)', animation: 'pulse 1s infinite' },
  skipBtn: { background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' },
  // Processing
  processingRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '20px', marginBottom: 16 },
  spinner: { width: 24, height: 24, border: '3px solid var(--color-border)', borderTop: '3px solid var(--color-teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  processingText: { fontSize: 15, color: 'var(--color-text-secondary)' },
  // Confirm card
  confirmCard: { background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: 16, boxShadow: 'var(--shadow-sm)', textAlign: 'center', border: '1px solid var(--color-border)' },
  confirmLabel: { fontSize: 11, color: 'var(--color-muted)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 6px', letterSpacing: 0.5 },
  confirmText: { fontFamily: 'var(--font-devanagari)', fontSize: 20, fontWeight: 700, color: 'var(--color-slate)', margin: '0 0 6px' },
  confirmSub: { fontSize: 14, color: 'var(--color-text-secondary)', margin: '0 0 16px' },
  confirmBtns: { display: 'flex', gap: 12 },
  btnYes: { flex: 1, background: 'var(--color-success)', color: '#fff', border: 'none', borderRadius: 'var(--radius-2xl)', padding: '12px', fontSize: 16, fontWeight: 700, cursor: 'pointer' },
  btnNo: { flex: 1, background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: '12px', fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  // Result card
  resultCard: { background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: 16, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)' },
  resultScoreRow: { display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 },
  resultScore: { fontSize: 52, fontWeight: 800 },
  resultScoreMax: { fontSize: 22, color: 'var(--color-muted)' },
  resultLabel: { marginLeft: 'auto', fontSize: 16, fontWeight: 700 },
  transcribedText: { fontFamily: 'var(--font-devanagari)', fontSize: 13, color: 'var(--color-muted)', margin: '0 0 10px', fontStyle: 'italic' },
  xpEarned: { display: 'inline-block', background: 'var(--color-success-subtle)', color: 'var(--color-success)', borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 700, marginBottom: 12 },
  resultBtns: { display: 'flex', gap: 12 },
  btnPrimary: { flex: 1, background: 'var(--color-teal)', color: '#fff', border: 'none', borderRadius: 'var(--radius-2xl)', padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer' },
  btnSecondary: { flex: 1, background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-2xl)', padding: '14px', fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  // Tip card
  tipCard: { background: 'var(--color-teal-subtle)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', border: '1px solid var(--color-teal)', marginTop: 4 },
  tipLabel: { fontSize: 12, fontWeight: 700, color: 'var(--color-teal)', margin: '0 0 4px' },
  tipText: { fontSize: 13, color: 'var(--color-slate)', margin: 0, lineHeight: 1.5 },
  // Done screen
  doneHero: { background: 'var(--color-surface)', borderRadius: 20, padding: '32px 24px', textAlign: 'center', marginBottom: 20, boxShadow: 'var(--shadow-md)' },
  doneEmoji: { marginBottom: 8, display: 'flex', justifyContent: 'center' },
  doneTitle: { fontSize: 26, fontWeight: 800, color: 'var(--color-slate)', margin: '0 0 12px' },
  doneScore: { fontSize: 64, fontWeight: 800, color: 'var(--color-teal)' },
  doneScoreLabel: { fontSize: 14, color: 'var(--color-muted)', marginBottom: 12 },
  xpBadge: { display: 'inline-block', background: 'var(--color-success-subtle)', color: 'var(--color-success)', borderRadius: 20, padding: '6px 18px', fontSize: 15, fontWeight: 700 },
  scoreBreakdown: { background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: 16, boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 10 },
  scoreRow: { display: 'flex', alignItems: 'center', gap: 10 },
  scorePhrase: { flex: 1, fontFamily: 'var(--font-devanagari)', fontSize: 15, color: 'var(--color-slate)', fontWeight: 600 },
  scorePill: { color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 13, fontWeight: 700 },
};
