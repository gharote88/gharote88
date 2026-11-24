import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storyApi, writingApi, gamificationApi } from '../api/client';

type Chapter = {
  id: string; title: string; titleMarathi: string; description: string;
  requiredLevel: number; locked: boolean; orderIndex: number;
  progress: { status: string; currentSceneId?: string } | null;
};

type Scene = {
  id: string; orderIndex: number; sceneType: 'dialogue' | 'read_sign' | 'write_note' | 'mixed';
  narrativeText?: string; backgroundImageUrl?: string; characterImageUrl?: string;
  dialogueOptions?: { text: string; transliteration: string; isCorrect: boolean; nextSceneId?: string }[];
  readingContent?: string; writingPrompt?: string; xpReward: number;
};

type Stroke = { x: number; y: number }[];
type View = 'chapters' | 'scene' | 'complete';

const SCENE_TYPE_ICONS: Record<string, string> = {
  dialogue: '💬', read_sign: '📖', write_note: '✍️', mixed: '🎭',
};

export default function StoryPage() {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [view, setView] = useState<View>('chapters');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [loading, setLoading] = useState(true);

  // Canvas for write_note scenes
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke>([]);
  const [drawing, setDrawing] = useState(false);
  const [writeResult, setWriteResult] = useState<any>(null);
  const [writeSubmitting, setWriteSubmitting] = useState(false);

  useEffect(() => {
    storyApi.chapters().then((res: any) => {
      setChapters(Array.isArray(res) ? res : []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (view === 'scene') redrawCanvas();
  }, [strokes, currentStroke, view]);

  async function openChapter(chapter: Chapter) {
    if (chapter.locked) return;
    setLoading(true);
    try {
      const res: any = await storyApi.scenes(chapter.id);
      setScenes(res.scenes ?? []);
      setActiveChapter(chapter);
      // Resume from saved progress
      const resumeId = chapter.progress?.currentSceneId;
      const resumeIdx = resumeId ? (res.scenes ?? []).findIndex((sc: Scene) => sc.id === resumeId) : 0;
      setSceneIdx(Math.max(0, resumeIdx));
      setView('scene');
      setSelectedOption(null);
      setFeedback(null);
      setTotalXp(0);
      resetCanvas();
      await storyApi.saveProgress(chapter.id, res.scenes?.[0]?.id ?? '', 'in_progress');
    } finally {
      setLoading(false);
    }
  }

  // ── Canvas helpers ──────────────────────────────────────────────────────────
  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
    if ('touches' in e) return { x: (e.touches[0].clientX - rect.left) * sx, y: (e.touches[0].clientY - rect.top) * sy };
    return { x: ((e as React.MouseEvent).clientX - rect.left) * sx, y: ((e as React.MouseEvent).clientY - rect.top) * sy };
  }
  function startDraw(e: React.MouseEvent | React.TouchEvent) { e.preventDefault(); setDrawing(true); setCurrentStroke([getPos(e, canvasRef.current!)]); setWriteResult(null); }
  function moveDraw(e: React.MouseEvent | React.TouchEvent) { e.preventDefault(); if (!drawing) return; setCurrentStroke(p => [...p, getPos(e, canvasRef.current!)]); }
  function endDraw(e: React.MouseEvent | React.TouchEvent) { e.preventDefault(); if (!drawing || !currentStroke.length) return; setStrokes(p => [...p, currentStroke]); setCurrentStroke([]); setDrawing(false); }
  function resetCanvas() { setStrokes([]); setCurrentStroke([]); setWriteResult(null); }

  function redrawCanvas() {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();
    const all = [...strokes, ...(currentStroke.length ? [currentStroke] : [])];
    ctx.strokeStyle = writeResult ? (writeResult.score >= 70 ? '#16a34a' : '#dc2626') : '#1a1a2e';
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const stroke of all) {
      if (stroke.length < 2) continue;
      ctx.beginPath(); ctx.moveTo(stroke[0].x, stroke[0].y);
      for (const pt of stroke.slice(1)) ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    }
  }

  async function submitWriting(scene: Scene) {
    if (!strokes.length) return;
    setWriteSubmitting(true);
    try {
      // Use first character of writing prompt as the character to evaluate
      const charRes: any = await writingApi.characters('beginner');
      const char = charRes.characters?.[0];
      if (!char) { setWriteResult({ score: 75 }); return; }
      const res = await writingApi.evaluate(char.id, strokes, `story-write-${scene.id}-${Date.now()}`);
      setWriteResult(res);
    } catch {
      setWriteResult({ score: 60 });
    } finally {
      setWriteSubmitting(false);
    }
  }

  // ── Scene navigation ────────────────────────────────────────────────────────
  async function advanceScene(xpEarned = 0) {
    const scene = scenes[sceneIdx];
    const newXp = totalXp + xpEarned + (scene?.xpReward ?? 0);
    setTotalXp(newXp);

    if (xpEarned + (scene?.xpReward ?? 0) > 0) {
      await gamificationApi.awardXp(xpEarned + (scene?.xpReward ?? 0), 'story', `story-${scene?.id}-${Date.now()}`).catch(() => null);
    }

    const nextIdx = sceneIdx + 1;
    if (nextIdx >= scenes.length) {
      // Chapter complete
      await storyApi.saveProgress(activeChapter!.id, scene.id, 'completed');
      setView('complete');
    } else {
      const nextScene = scenes[nextIdx];
      await storyApi.saveProgress(activeChapter!.id, nextScene.id, 'in_progress');
      setSceneIdx(nextIdx);
      setSelectedOption(null);
      setFeedback(null);
      resetCanvas();
    }
  }

  function handleDialogueChoice(optIdx: number, scene: Scene) {
    if (feedback) return;
    setSelectedOption(optIdx);
    const opt = scene.dialogueOptions![optIdx];
    setFeedback(opt.isCorrect ? 'correct' : 'wrong');
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return <div style={s.loading}>Loading...</div>;

  if (view === 'complete') return (
    <div style={s.page}>
      <div style={s.completeHero}>
        <div style={s.completeEmoji}>🎭</div>
        <h2 style={s.completeTitle}>{activeChapter?.title} Complete!</h2>
        <div style={s.completeXp}>+{totalXp} XP earned</div>
      </div>
      <div style={s.completeStat}>
        <span>Scenes completed</span>
        <span style={s.completeStatVal}>{scenes.length}</span>
      </div>
      <button style={s.btnPrimary} onClick={() => { setView('chapters'); setChapters([]); setLoading(true); storyApi.chapters().then((r: any) => setChapters(Array.isArray(r) ? r : [])).finally(() => setLoading(false)); }}>
        Back to Chapters
      </button>
      <button style={s.btnSecondary} onClick={() => navigate('/dashboard')}>Dashboard</button>
    </div>
  );

  if (view === 'scene' && scenes.length > 0) {
    const scene = scenes[sceneIdx];
    return (
      <div style={s.page}>
        {/* Header */}
        <div style={s.header}>
          <button style={s.back} onClick={() => setView('chapters')}>← Chapters</button>
          <span style={s.sceneCounter}>{sceneIdx + 1}/{scenes.length}</span>
          <span style={s.sceneTypeChip}>{SCENE_TYPE_ICONS[scene.sceneType]} {scene.sceneType.replace('_', ' ')}</span>
        </div>

        {/* Scene progress bar */}
        <div style={s.progressBg}>
          <div style={{ ...s.progressFill, width: `${((sceneIdx + 1) / scenes.length) * 100}%` }} />
        </div>

        {/* Background / character art */}
        {(scene.backgroundImageUrl || scene.characterImageUrl) && (
          <div style={s.sceneArt}>
            {scene.backgroundImageUrl && <img src={scene.backgroundImageUrl} alt="" style={s.bgImg} />}
            {scene.characterImageUrl && <img src={scene.characterImageUrl} alt="" style={s.charImg} />}
          </div>
        )}

        {/* Narrative text */}
        {scene.narrativeText && (
          <div style={s.narrativeBox}>
            <p style={s.narrativeText}>{scene.narrativeText}</p>
          </div>
        )}

        {/* DIALOGUE scene */}
        {(scene.sceneType === 'dialogue' || scene.sceneType === 'mixed') && scene.dialogueOptions?.length && (
          <div style={s.dialogueSection}>
            <p style={s.dialoguePrompt}>Choose the correct response:</p>
            {scene.dialogueOptions.map((opt, i) => {
              let style = s.optionBtn;
              if (feedback && selectedOption === i) style = { ...s.optionBtn, ...(opt.isCorrect ? s.optionCorrect : s.optionWrong) };
              else if (feedback && opt.isCorrect) style = { ...s.optionBtn, ...s.optionCorrect };
              return (
                <button key={i} style={style} onClick={() => handleDialogueChoice(i, scene)} disabled={!!feedback}>
                  <span style={s.optionMarathi}>{opt.text}</span>
                  <span style={s.optionRoman}>{opt.transliteration}</span>
                </button>
              );
            })}
            {feedback && (
              <div style={{ ...s.feedbackBanner, background: feedback === 'correct' ? '#dcfce7' : '#fee2e2', color: feedback === 'correct' ? '#16a34a' : '#dc2626' }}>
                {feedback === 'correct' ? '✓ Correct!' : '✗ Try to remember this one'}
              </div>
            )}
            {feedback && (
              <button style={s.btnPrimary} onClick={() => advanceScene(feedback === 'correct' ? 10 : 0)}>
                {sceneIdx + 1 >= scenes.length ? 'Finish Chapter' : 'Next Scene →'}
              </button>
            )}
          </div>
        )}

        {/* READ_SIGN scene */}
        {scene.sceneType === 'read_sign' && (
          <div style={s.readSection}>
            <div style={s.signCard}>
              <p style={s.signText}>{scene.readingContent}</p>
            </div>
            <button style={s.btnPrimary} onClick={() => advanceScene(15)}>
              {sceneIdx + 1 >= scenes.length ? 'Finish Chapter' : 'I read it! →'}
            </button>
          </div>
        )}

        {/* WRITE_NOTE scene */}
        {scene.sceneType === 'write_note' && (
          <div style={s.writeSection}>
            <p style={s.writePrompt}>{scene.writingPrompt ?? 'Write what you see:'}</p>
            <canvas
              ref={canvasRef} width={300} height={200} style={s.canvas}
              onMouseDown={startDraw} onMouseMove={moveDraw} onMouseUp={endDraw} onMouseLeave={endDraw}
              onTouchStart={startDraw} onTouchMove={moveDraw} onTouchEnd={endDraw}
            />
            {writeResult && (
              <div style={{ ...s.writeScore, color: writeResult.score >= 70 ? '#16a34a' : '#dc2626' }}>
                Score: {writeResult.score}/100 {writeResult.score >= 70 ? '✓' : '— keep practicing!'}
              </div>
            )}
            <div style={s.writeBtns}>
              <button style={s.btnSecondary} onClick={resetCanvas}>Clear</button>
              {!writeResult
                ? <button style={s.btnPrimary} onClick={() => submitWriting(scene)} disabled={writeSubmitting || !strokes.length}>
                    {writeSubmitting ? 'Checking...' : 'Submit'}
                  </button>
                : <button style={s.btnPrimary} onClick={() => advanceScene(writeResult.score >= 70 ? 20 : 5)}>
                    {sceneIdx + 1 >= scenes.length ? 'Finish Chapter' : 'Next Scene →'}
                  </button>
              }
            </div>
          </div>
        )}
      </div>
    );
  }

  // Chapter list
  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/dashboard')}>← Back</button>
        <h2 style={s.title}>Story Mode</h2>
      </div>
      <p style={s.subtitle}>Learn Marathi through interactive stories</p>

      {chapters.length === 0 && <div style={s.empty}>No chapters available yet.</div>}

      {chapters.map(ch => (
        <div
          key={ch.id}
          style={{ ...s.chapterCard, ...(ch.locked ? s.chapterLocked : {}) }}
          onClick={() => openChapter(ch)}
        >
          <div style={s.chapterIcon}>{ch.locked ? '🔒' : ch.progress?.status === 'completed' ? '✅' : '📖'}</div>
          <div style={s.chapterInfo}>
            <div style={s.chapterTitle}>{ch.title}</div>
            <div style={s.chapterMarathi}>{ch.titleMarathi}</div>
            <div style={s.chapterMeta}>
              {ch.locked ? `Requires Level ${ch.requiredLevel}` : ch.description}
            </div>
          </div>
          {!ch.locked && (
            <div style={s.chapterStatus}>
              {ch.progress?.status === 'completed'
                ? <span style={s.statusDone}>Done</span>
                : ch.progress?.status === 'in_progress'
                  ? <span style={s.statusInProgress}>Resume</span>
                  : <span style={s.statusNew}>Start</span>
              }
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 480, margin: '0 auto', padding: '24px 16px 40px', fontFamily: 'system-ui, sans-serif', background: '#f8f9fa', minHeight: '100vh' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 18, color: '#666' },
  header: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  back: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#FF6B35', fontWeight: 600, padding: 0 },
  title: { flex: 1, fontSize: 20, fontWeight: 700, margin: 0, color: '#1a1a2e' },
  subtitle: { fontSize: 14, color: '#888', margin: '0 0 20px' },
  sceneCounter: { fontSize: 13, color: '#888' },
  sceneTypeChip: { background: '#f0f0f0', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'capitalize' },
  progressBg: { height: 4, background: '#e5e7eb', borderRadius: 2, marginBottom: 16, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #FF6B35, #F7931E)', transition: 'width 0.4s ease' },
  sceneArt: { position: 'relative', height: 160, borderRadius: 16, overflow: 'hidden', marginBottom: 16, background: '#e5e7eb' },
  bgImg: { width: '100%', height: '100%', objectFit: 'cover' },
  charImg: { position: 'absolute', bottom: 0, right: 16, height: '90%', objectFit: 'contain' },
  narrativeBox: { background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  narrativeText: { fontSize: 16, color: '#1a1a2e', margin: 0, lineHeight: 1.6 },
  dialogueSection: { display: 'flex', flexDirection: 'column', gap: 10 },
  dialoguePrompt: { fontSize: 13, fontWeight: 700, color: '#888', textTransform: 'uppercase', margin: 0 },
  optionBtn: { background: '#fff', border: '2px solid #e5e7eb', borderRadius: 14, padding: '12px 16px', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2 },
  optionCorrect: { background: '#dcfce7', borderColor: '#16a34a' },
  optionWrong: { background: '#fee2e2', borderColor: '#dc2626' },
  optionMarathi: { fontSize: 18, fontWeight: 700, color: '#1a1a2e' },
  optionRoman: { fontSize: 12, color: '#888' },
  feedbackBanner: { borderRadius: 12, padding: '10px 16px', fontSize: 14, fontWeight: 700, textAlign: 'center' },
  readSection: { display: 'flex', flexDirection: 'column', gap: 16 },
  signCard: { background: '#fffbeb', border: '2px solid #fcd34d', borderRadius: 16, padding: '24px', textAlign: 'center' },
  signText: { fontSize: 28, fontWeight: 800, color: '#1a1a2e', margin: 0, lineHeight: 1.5 },
  writeSection: { display: 'flex', flexDirection: 'column', gap: 12 },
  writePrompt: { fontSize: 15, fontWeight: 600, color: '#1a1a2e', margin: 0 },
  canvas: { display: 'block', width: '100%', maxWidth: 300, background: '#fff', borderRadius: 14, border: '2px solid #e5e7eb', cursor: 'crosshair', touchAction: 'none', aspectRatio: '3/2' },
  writeScore: { fontSize: 15, fontWeight: 700, textAlign: 'center' },
  writeBtns: { display: 'flex', gap: 12 },
  btnPrimary: { flex: 1, background: '#FF6B35', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
  btnSecondary: { flex: 1, background: '#f0f0f0', color: '#333', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
  chapterCard: { background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer' },
  chapterLocked: { opacity: 0.55, cursor: 'not-allowed' },
  chapterIcon: { fontSize: 32, flexShrink: 0 },
  chapterInfo: { flex: 1 },
  chapterTitle: { fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 2 },
  chapterMarathi: { fontSize: 14, color: '#FF6B35', fontWeight: 600, marginBottom: 4 },
  chapterMeta: { fontSize: 12, color: '#888' },
  chapterStatus: {},
  statusDone: { background: '#dcfce7', color: '#16a34a', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 },
  statusInProgress: { background: '#fff3e0', color: '#FF6B35', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 },
  statusNew: { background: '#f0f0f0', color: '#555', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 },
  completeHero: { background: '#fff', borderRadius: 20, padding: '32px 24px', textAlign: 'center', marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
  completeEmoji: { fontSize: 56, marginBottom: 8 },
  completeTitle: { fontSize: 24, fontWeight: 800, color: '#1a1a2e', margin: '0 0 12px' },
  completeXp: { display: 'inline-block', background: '#dcfce7', color: '#16a34a', borderRadius: 20, padding: '6px 18px', fontSize: 15, fontWeight: 700 },
  completeStat: { background: '#fff', borderRadius: 14, padding: '14px 20px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', fontSize: 15, color: '#555' },
  completeStatVal: { fontWeight: 800, color: '#1a1a2e', fontSize: 20 },
  empty: { textAlign: 'center', color: '#888', marginTop: 60, fontSize: 16 },
};
