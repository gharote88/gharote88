import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Path } from 'react-native-svg';
import { supabase } from '@marathi-learning/shared';

type View_ = 'chapters' | 'scene' | 'complete';
type Feedback = 'correct' | 'wrong' | null;
type Point = { x: number; y: number };

export default function StoryScreen() {
  const router = useRouter();
  const [chapters, setChapters] = useState<any[]>([]);
  const [scenes, setScenes] = useState<any[]>([]);
  const [activeChapter, setActiveChapter] = useState<any>(null);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [view, setView] = useState<View_>('chapters');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [writeResult, setWriteResult] = useState<any>(null);
  const [writeSubmitting, setWriteSubmitting] = useState(false);

  useEffect(() => { loadChapters(); }, []);

  async function api(path: string, opts?: RequestInit) {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}${path}`, {
      ...opts,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}`, ...(opts?.headers ?? {}) },
    });
    return res.json();
  }

  async function loadChapters() {
    try {
      const res = await api('/api/story/chapters');
      setChapters(Array.isArray(res) ? res : []);
    } finally {
      setLoading(false);
    }
  }

  async function openChapter(ch: any) {
    if (ch.locked) return;
    setLoading(true);
    try {
      const res = await api(`/api/story/scenes?chapterId=${ch.id}`);
      const sceneList = res.scenes ?? [];
      setScenes(sceneList);
      setActiveChapter(ch);
      const resumeId = ch.progress?.currentSceneId;
      const resumeIdx = resumeId ? sceneList.findIndex((sc: any) => sc.id === resumeId) : 0;
      setSceneIdx(Math.max(0, resumeIdx));
      setView('scene');
      setSelectedOption(null);
      setFeedback(null);
      setTotalXp(0);
      resetCanvas();
      if (sceneList[0]) await api('/api/story/progress', { method: 'POST', body: JSON.stringify({ chapterId: ch.id, currentSceneId: sceneList[0].id, status: 'in_progress' }) });
    } finally {
      setLoading(false);
    }
  }

  function resetCanvas() { setStrokes([]); setCurrentStroke([]); setWriteResult(null); }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: e => { setCurrentStroke([{ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY }]); setWriteResult(null); },
      onPanResponderMove: e => setCurrentStroke(p => [...p, { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY }]),
      onPanResponderRelease: () => { setStrokes(p => [...p, currentStroke]); setCurrentStroke([]); },
    })
  ).current;

  function strokeToPath(pts: Point[]) {
    if (pts.length < 2) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }

  async function submitWriting(scene: any) {
    if (!strokes.length) return;
    setWriteSubmitting(true);
    try {
      const charRes = await api('/api/writing/characters?level=beginner');
      const char = charRes.characters?.[0];
      if (!char) { setWriteResult({ score: 75 }); return; }
      const res = await api('/api/writing/evaluate', { method: 'POST', body: JSON.stringify({ characterId: char.id, userStrokes: strokes, referenceId: `story-write-${scene.id}-${Date.now()}` }) });
      setWriteResult(res);
    } catch { setWriteResult({ score: 60 }); }
    finally { setWriteSubmitting(false); }
  }

  async function advanceScene(xpEarned = 0) {
    const scene = scenes[sceneIdx];
    const gained = xpEarned + (scene?.xpReward ?? 0);
    setTotalXp(t => t + gained);
    if (gained > 0) await api('/api/gamification/xp/award', { method: 'POST', body: JSON.stringify({ xpAmount: gained, source: 'story', referenceId: `story-${scene?.id}-${Date.now()}` }) }).catch(() => null);
    const nextIdx = sceneIdx + 1;
    if (nextIdx >= scenes.length) {
      await api('/api/story/progress', { method: 'POST', body: JSON.stringify({ chapterId: activeChapter.id, currentSceneId: scene.id, status: 'completed' }) });
      setView('complete');
    } else {
      await api('/api/story/progress', { method: 'POST', body: JSON.stringify({ chapterId: activeChapter.id, currentSceneId: scenes[nextIdx].id, status: 'in_progress' }) });
      setSceneIdx(nextIdx);
      setSelectedOption(null);
      setFeedback(null);
      resetCanvas();
    }
  }

  if (loading) return <SafeAreaView style={s.container}><View style={s.center}><ActivityIndicator size="large" color="#FF6B35" /></View></SafeAreaView>;

  if (view === 'complete') return (
    <SafeAreaView style={s.container}>
      <View style={s.center}>
        <Text style={{ fontSize: 56, marginBottom: 12 }}>🎭</Text>
        <Text style={s.completeTitle}>{activeChapter?.title} Complete!</Text>
        <Text style={s.completeXp}>+{totalXp} XP earned</Text>
        <TouchableOpacity style={s.primaryBtn} onPress={() => { setView('chapters'); loadChapters(); }}>
          <Text style={s.primaryBtnText}>Back to Chapters</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondaryBtn} onPress={() => router.push('/dashboard')}>
          <Text style={s.secondaryBtnText}>Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  if (view === 'scene' && scenes.length > 0) {
    const scene = scenes[sceneIdx];
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setView('chapters')}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
          <Text style={s.headerTitle}>{activeChapter?.title}</Text>
          <Text style={s.counter}>{sceneIdx + 1}/{scenes.length}</Text>
        </View>
        {/* Progress bar */}
        <View style={s.progressBg}><View style={[s.progressFill, { width: `${((sceneIdx + 1) / scenes.length) * 100}%` as any }]} /></View>
        <ScrollView contentContainerStyle={s.sceneScroll}>
          {scene.narrativeText && <View style={s.narrativeBox}><Text style={s.narrativeText}>{scene.narrativeText}</Text></View>}

          {/* Dialogue */}
          {(scene.sceneType === 'dialogue' || scene.sceneType === 'mixed') && scene.dialogueOptions?.length > 0 && (
            <View style={s.dialogueSection}>
              <Text style={s.dialoguePrompt}>Choose the correct response:</Text>
              {scene.dialogueOptions.map((opt: any, i: number) => {
                let style = s.optionBtn;
                if (feedback && selectedOption === i) style = { ...s.optionBtn, ...(opt.isCorrect ? s.optionCorrect : s.optionWrong) } as any;
                else if (feedback && opt.isCorrect) style = { ...s.optionBtn, ...s.optionCorrect } as any;
                return (
                  <TouchableOpacity key={i} style={style} onPress={() => { if (feedback) return; setSelectedOption(i); setFeedback(opt.isCorrect ? 'correct' : 'wrong'); }} disabled={!!feedback}>
                    <Text style={s.optionMarathi}>{opt.text}</Text>
                    <Text style={s.optionRoman}>{opt.transliteration}</Text>
                  </TouchableOpacity>
                );
              })}
              {feedback && <View style={[s.feedbackBanner, { backgroundColor: feedback === 'correct' ? '#dcfce7' : '#fee2e2' }]}><Text style={{ color: feedback === 'correct' ? '#16a34a' : '#dc2626', fontWeight: '700' }}>{feedback === 'correct' ? '✓ Correct!' : '✗ Try to remember this one'}</Text></View>}
              {feedback && <TouchableOpacity style={s.primaryBtn} onPress={() => advanceScene(feedback === 'correct' ? 10 : 0)}><Text style={s.primaryBtnText}>{sceneIdx + 1 >= scenes.length ? 'Finish Chapter' : 'Next Scene →'}</Text></TouchableOpacity>}
            </View>
          )}

          {/* Read sign */}
          {scene.sceneType === 'read_sign' && (
            <View>
              <View style={s.signCard}><Text style={s.signText}>{scene.readingContent}</Text></View>
              <TouchableOpacity style={s.primaryBtn} onPress={() => advanceScene(15)}><Text style={s.primaryBtnText}>{sceneIdx + 1 >= scenes.length ? 'Finish Chapter' : 'I read it! →'}</Text></TouchableOpacity>
            </View>
          )}

          {/* Write note */}
          {scene.sceneType === 'write_note' && (
            <View>
              <Text style={s.writePrompt}>{scene.writingPrompt ?? 'Write what you see:'}</Text>
              <View style={s.canvas} {...panResponder.panHandlers}>
                <Svg height="200" width="100%">
                  {strokes.map((stroke, i) => <Path key={i} d={strokeToPath(stroke)} stroke={writeResult ? (writeResult.score >= 70 ? '#16a34a' : '#dc2626') : '#1a1a2e'} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />)}
                  {currentStroke.length > 1 && <Path d={strokeToPath(currentStroke)} stroke="#1a1a2e" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
                </Svg>
              </View>
              {writeResult && <Text style={[s.writeScore, { color: writeResult.score >= 70 ? '#16a34a' : '#dc2626' }]}>Score: {writeResult.score}/100 {writeResult.score >= 70 ? '✓' : '— keep practicing!'}</Text>}
              <View style={s.writeBtns}>
                <TouchableOpacity style={s.secondaryBtn} onPress={resetCanvas}><Text style={s.secondaryBtnText}>Clear</Text></TouchableOpacity>
                {!writeResult
                  ? <TouchableOpacity style={s.primaryBtn} onPress={() => submitWriting(scene)} disabled={writeSubmitting || !strokes.length}><Text style={s.primaryBtnText}>{writeSubmitting ? 'Checking...' : 'Submit'}</Text></TouchableOpacity>
                  : <TouchableOpacity style={s.primaryBtn} onPress={() => advanceScene(writeResult.score >= 70 ? 20 : 5)}><Text style={s.primaryBtnText}>{sceneIdx + 1 >= scenes.length ? 'Finish Chapter' : 'Next Scene →'}</Text></TouchableOpacity>
                }
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
        <Text style={s.headerTitle}>Story Mode</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={s.subtitle}>Learn Marathi through interactive stories</Text>
        {chapters.length === 0 && <Text style={s.empty}>No chapters available yet.</Text>}
        {chapters.map(ch => (
          <TouchableOpacity key={ch.id} style={[s.chapterCard, ch.locked && s.chapterLocked]} onPress={() => openChapter(ch)}>
            <Text style={{ fontSize: 32 }}>{ch.locked ? '🔒' : ch.progress?.status === 'completed' ? '✅' : '📖'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.chapterTitle}>{ch.title}</Text>
              <Text style={s.chapterMarathi}>{ch.titleMarathi}</Text>
              <Text style={s.chapterMeta}>{ch.locked ? `Requires Level ${ch.requiredLevel}` : ch.description}</Text>
            </View>
            {!ch.locked && (
              <View style={[s.statusBadge, ch.progress?.status === 'completed' ? s.statusDone : ch.progress?.status === 'in_progress' ? s.statusInProgress : s.statusNew]}>
                <Text style={s.statusText}>{ch.progress?.status === 'completed' ? 'Done' : ch.progress?.status === 'in_progress' ? 'Resume' : 'Start'}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', flex: 1, textAlign: 'center' },
  counter: { fontSize: 13, color: '#888' },
  progressBg: { height: 4, backgroundColor: '#e5e7eb' },
  progressFill: { height: 4, backgroundColor: '#FF6B35' },
  sceneScroll: { padding: 16, paddingBottom: 40 },
  narrativeBox: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  narrativeText: { fontSize: 16, color: '#1a1a2e', lineHeight: 24 },
  dialogueSection: { gap: 10 },
  dialoguePrompt: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase' },
  optionBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 14, padding: 14 },
  optionCorrect: { backgroundColor: '#dcfce7', borderColor: '#16a34a' },
  optionWrong: { backgroundColor: '#fee2e2', borderColor: '#dc2626' },
  optionMarathi: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  optionRoman: { fontSize: 12, color: '#888', marginTop: 2 },
  feedbackBanner: { borderRadius: 12, padding: 12, alignItems: 'center' },
  signCard: { backgroundColor: '#fffbeb', borderWidth: 2, borderColor: '#fcd34d', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
  signText: { fontSize: 28, fontWeight: '800', color: '#1a1a2e', textAlign: 'center', lineHeight: 40 },
  writePrompt: { fontSize: 15, fontWeight: '600', color: '#1a1a2e', marginBottom: 12 },
  canvas: { height: 200, backgroundColor: '#fff', borderRadius: 14, borderWidth: 2, borderColor: '#e5e7eb', marginBottom: 12, overflow: 'hidden' },
  writeScore: { fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  writeBtns: { flexDirection: 'row', gap: 12 },
  primaryBtn: { flex: 1, backgroundColor: '#FF6B35', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  secondaryBtnText: { color: '#333', fontSize: 16, fontWeight: '600' },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 16 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 16 },
  chapterCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  chapterLocked: { opacity: 0.55 },
  chapterTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 },
  chapterMarathi: { fontSize: 14, color: '#FF6B35', fontWeight: '600', marginBottom: 4 },
  chapterMeta: { fontSize: 12, color: '#888' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  statusDone: { backgroundColor: '#dcfce7' },
  statusInProgress: { backgroundColor: '#fff3e0' },
  statusNew: { backgroundColor: '#f0f0f0' },
  statusText: { fontSize: 12, fontWeight: '700', color: '#555' },
  completeTitle: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', marginBottom: 8 },
  completeXp: { fontSize: 16, color: '#16a34a', fontWeight: '700', marginBottom: 24, backgroundColor: '#dcfce7', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 6 },
});
