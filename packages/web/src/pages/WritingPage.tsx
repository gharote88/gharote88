import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { writingApi, gamificationApi } from '../api/client';

type Stroke = { x: number; y: number }[];
type Character = { id: string; character: string; transliteration: string; strokeData: Stroke[] };

export default function WritingPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [current, setCurrent] = useState(0);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke>([]);
  const [drawing, setDrawing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [progress, setProgress] = useState<any>(null);

  useEffect(() => {
    writingApi.characters('beginner').then((res: any) => setCharacters(res.characters || []));
    writingApi.progress().then(setProgress).catch(() => null);
  }, []);

  useEffect(() => {
    redraw();
  }, [strokes, currentStroke]);

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * scaleX, y: ((e as React.MouseEvent).clientY - rect.top) * scaleY };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const canvas = canvasRef.current!;
    setDrawing(true);
    setCurrentStroke([getPos(e, canvas)]);
    setResult(null);
  }

  function moveDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current!;
    setCurrentStroke(prev => [...prev, getPos(e, canvas)]);
  }

  function endDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!drawing || currentStroke.length === 0) return;
    setStrokes(prev => [...prev, currentStroke]);
    setCurrentStroke([]);
    setDrawing(false);
  }

  function redraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid guide
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();

    // Overlay correct path if result
    if (result && characters[current]?.strokeData) {
      ctx.strokeStyle = 'rgba(34,197,94,0.3)';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const stroke of characters[current].strokeData) {
        if (stroke.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (const pt of stroke.slice(1)) ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
      }
    }

    // User strokes
    const allStrokes = [...strokes, ...(currentStroke.length ? [currentStroke] : [])];
    ctx.strokeStyle = result ? (result.score >= 70 ? '#16a34a' : '#dc2626') : '#1a1a2e';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const stroke of allStrokes) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (const pt of stroke.slice(1)) ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    }
  }

  async function submit() {
    if (strokes.length === 0 || !characters[current]) return;
    setSubmitting(true);
    try {
      const char = characters[current];
      const res = await writingApi.evaluate(char.id, strokes, `writing-${char.id}-${Date.now()}`);
      setResult(res);
      if (res.score >= 70) {
        await gamificationApi.awardXp(10, 'writing', `writing-xp-${char.id}-${Date.now()}`).catch(() => null);
      }
    } catch {
      setResult({ score: 0, error: true });
    } finally {
      setSubmitting(false);
    }
  }

  function clear() {
    setStrokes([]);
    setCurrentStroke([]);
    setResult(null);
  }

  function next() {
    clear();
    setCurrent(i => Math.min(i + 1, characters.length - 1));
  }

  function prev() {
    clear();
    setCurrent(i => Math.max(i - 1, 0));
  }

  const char = characters[current];

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/dashboard')}>← Back</button>
        <h2 style={s.title}>Writing Practice</h2>
        <span style={s.counter}>{current + 1}/{characters.length || '—'}</span>
      </div>

      {progress && (
        <div style={s.progressBar}>
          <span style={s.progressText}>✍️ {progress.charactersMastered ?? 0} characters mastered</span>
        </div>
      )}

      {char ? (
        <>
          <div style={s.charCard}>
            <div style={s.charDisplay}>{char.character}</div>
            <div style={s.charRoman}>{char.transliteration}</div>
            <button style={s.demoBtn} onClick={() => setShowDemo(d => !d)}>
              {showDemo ? 'Hide' : 'Show'} stroke guide
            </button>
          </div>

          {showDemo && char.strokeData?.length > 0 && (
            <div style={s.demoHint}>
              <span style={s.demoLabel}>Reference strokes: {char.strokeData.length}</span>
              <span style={s.demoSub}>Follow the order shown in green on canvas</span>
            </div>
          )}

          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            style={s.canvas}
            onMouseDown={startDraw}
            onMouseMove={moveDraw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={moveDraw}
            onTouchEnd={endDraw}
          />

          {result && (
            <div style={{ ...s.resultCard, borderColor: result.score >= 70 ? '#16a34a' : '#dc2626' }}>
              <div style={s.scoreRow}>
                <span style={{ ...s.scoreBig, color: result.score >= 70 ? '#16a34a' : '#dc2626' }}>{result.score ?? 0}</span>
                <span style={s.scoreLabel}>/100</span>
                <span style={s.scoreBadge}>{result.score >= 80 ? '⭐ Excellent!' : result.score >= 60 ? '👍 Good' : '🔄 Try again'}</span>
              </div>
              {result.perCharacter && (
                <div style={s.perChar}>
                  {result.perCharacter.map((c: any, i: number) => (
                    <span key={i} style={{ ...s.charChip, background: c.score >= 70 ? '#dcfce7' : '#fee2e2', color: c.score >= 70 ? '#16a34a' : '#dc2626' }}>
                      {c.character}: {c.score}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={s.controls}>
            <button style={s.btnSecondary} onClick={clear}>Clear</button>
            {result ? (
              <button style={s.btnPrimary} onClick={next} disabled={current >= characters.length - 1}>Next →</button>
            ) : (
              <button style={s.btnPrimary} onClick={submit} disabled={submitting || strokes.length === 0}>
                {submitting ? 'Checking...' : 'Submit'}
              </button>
            )}
          </div>

          <div style={s.navRow}>
            <button style={s.navBtn} onClick={prev} disabled={current === 0}>← Prev</button>
            <button style={s.navBtn} onClick={next} disabled={current >= characters.length - 1}>Next →</button>
          </div>
        </>
      ) : (
        <div style={s.empty}>Loading characters...</div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 480, margin: '0 auto', padding: '24px 16px 40px', fontFamily: 'system-ui, sans-serif', background: '#f8f9fa', minHeight: '100vh' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  back: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#FF6B35', fontWeight: 600, padding: 0 },
  title: { flex: 1, fontSize: 20, fontWeight: 700, margin: 0, color: '#1a1a2e' },
  counter: { fontSize: 13, color: '#888' },
  progressBar: { background: '#fff', borderRadius: 12, padding: '10px 16px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  progressText: { fontSize: 13, color: '#666', fontWeight: 500 },
  charCard: { background: '#fff', borderRadius: 16, padding: '20px', marginBottom: 16, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  charDisplay: { fontSize: 72, lineHeight: 1.2, color: '#1a1a2e', marginBottom: 8 },
  charRoman: { fontSize: 18, color: '#666', marginBottom: 12 },
  demoBtn: { background: '#f0f0f0', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer', color: '#555' },
  demoHint: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '10px 16px', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 2 },
  demoLabel: { fontSize: 13, fontWeight: 600, color: '#16a34a' },
  demoSub: { fontSize: 12, color: '#4ade80' },
  canvas: { display: 'block', margin: '0 auto 16px', background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.1)', border: '2px solid #e5e7eb', cursor: 'crosshair', touchAction: 'none', width: '100%', maxWidth: 320, height: 'auto', aspectRatio: '1' },
  resultCard: { background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 16, border: '2px solid', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  scoreRow: { display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 },
  scoreBig: { fontSize: 48, fontWeight: 800 },
  scoreLabel: { fontSize: 20, color: '#888' },
  scoreBadge: { marginLeft: 'auto', fontSize: 14, fontWeight: 600 },
  perChar: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  charChip: { borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 600 },
  controls: { display: 'flex', gap: 12, marginBottom: 12 },
  btnPrimary: { flex: 1, background: '#FF6B35', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer' },
  btnSecondary: { flex: 1, background: '#f0f0f0', color: '#333', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  navRow: { display: 'flex', gap: 12 },
  navBtn: { flex: 1, background: '#fff', color: '#555', border: '1px solid #e5e7eb', borderRadius: 12, padding: '10px', fontSize: 14, cursor: 'pointer' },
  empty: { textAlign: 'center', color: '#888', marginTop: 60, fontSize: 16 },
};
