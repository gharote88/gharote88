import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@marathi-learning/shared';

type GameType = 'word_match' | 'fill_blank' | 'picture_word';
type GameState = 'menu' | 'playing' | 'result';

const GAME_TYPES: { key: GameType; label: string; emoji: string; description: string }[] = [
  { key: 'word_match', label: 'Word Match', emoji: '🔤', description: 'Match Marathi words to their meanings' },
  { key: 'fill_blank', label: 'Fill the Blank', emoji: '✏️', description: 'Complete the Marathi sentence' },
  { key: 'picture_word', label: 'Picture & Word', emoji: '🖼️', description: 'Match pictures to Marathi words' },
];

export default function MiniGamesScreen() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>('menu');
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [scores, setScores] = useState<boolean[]>([]);
  const [totalXp, setTotalXp] = useState(0);

  async function api(path: string, opts?: RequestInit) {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}${path}`, {
      ...opts,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}`, ...(opts?.headers ?? {}) },
    });
    return res.json();
  }

  async function startGame(type: GameType) {
    setLoading(true);
    try {
      const data = await api(`/api/mini-games?type=${type}`);
      setGameData(data);
      setActiveGame(type);
      setCurrentIdx(0);
      setSelected(null);
      setScores([]);
      setTotalXp(0);
      setGameState('playing');
    } catch {
      Alert.alert('Error', 'Failed to load game. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer(answer: string) {
    if (selected) return;
    setSelected(answer);
    const question = gameData?.questions?.[currentIdx];
    const correct = answer === question?.correctAnswer;
    setScores(s => [...s, correct]);
    if (correct) setTotalXp(x => x + (question?.xpReward ?? 5));
  }

  async function next() {
    const questions = gameData?.questions ?? [];
    if (currentIdx + 1 >= questions.length) {
      // Submit final score
      const finalScore = Math.round((scores.filter(Boolean).length / questions.length) * 100);
      try {
        await api('/api/mini-games', {
          method: 'POST',
          body: JSON.stringify({ gameId: gameData?.id, score: finalScore, referenceId: `minigame-${activeGame}-${Date.now()}` }),
        });
        if (totalXp > 0) {
          await api('/api/gamification/xp', {
            method: 'POST',
            body: JSON.stringify({ xpAmount: totalXp, source: 'mini_game', referenceId: `minigame-xp-${activeGame}-${Date.now()}` }),
          });
        }
      } catch { /* non-critical */ }
      setGameState('result');
    } else {
      setCurrentIdx(i => i + 1);
      setSelected(null);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}><ActivityIndicator size="large" color="#FF6B35" /></View>
      </SafeAreaView>
    );
  }

  if (gameState === 'result') {
    const total = gameData?.questions?.length ?? 0;
    const correct = scores.filter(Boolean).length;
    const pct = total ? Math.round((correct / total) * 100) : 0;
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}>
          <Text style={{ fontSize: 56, marginBottom: 12 }}>🎮</Text>
          <Text style={s.resultTitle}>Game Over!</Text>
          <Text style={s.resultScore}>{pct}%</Text>
          <Text style={s.resultSub}>{correct}/{total} correct</Text>
          {totalXp > 0 && <Text style={s.xpBadge}>+{totalXp} XP earned</Text>}
          <TouchableOpacity style={s.primaryBtn} onPress={() => { setGameState('menu'); setActiveGame(null); }}>
            <Text style={s.primaryBtnText}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => router.push('/dashboard')}>
            <Text style={s.secondaryBtnText}>Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (gameState === 'playing' && gameData) {
    const questions = gameData.questions ?? [];
    const q = questions[currentIdx];
    if (!q) return null;
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setGameState('menu')}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{GAME_TYPES.find(g => g.key === activeGame)?.label}</Text>
          <Text style={s.counter}>{currentIdx + 1}/{questions.length}</Text>
        </View>

        {/* Progress bar */}
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: `${((currentIdx + 1) / questions.length) * 100}%` as any }]} />
        </View>

        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.questionCard}>
            <Text style={s.questionText}>{q.question}</Text>
            {q.marathiText && <Text style={s.marathiText}>{q.marathiText}</Text>}
          </View>

          <View style={s.options}>
            {(q.options ?? []).map((opt: string) => {
              let optStyle = s.optionBtn;
              if (selected) {
                if (opt === q.correctAnswer) optStyle = { ...s.optionBtn, ...s.optionCorrect } as any;
                else if (opt === selected) optStyle = { ...s.optionBtn, ...s.optionWrong } as any;
              }
              return (
                <TouchableOpacity key={opt} style={optStyle} onPress={() => submitAnswer(opt)} disabled={!!selected}>
                  <Text style={[s.optionText, selected && opt === q.correctAnswer && s.optionTextCorrect]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selected && (
            <>
              <View style={[s.feedbackBanner, { backgroundColor: selected === q.correctAnswer ? '#dcfce7' : '#fee2e2' }]}>
                <Text style={{ fontWeight: '700', color: selected === q.correctAnswer ? '#16a34a' : '#dc2626' }}>
                  {selected === q.correctAnswer ? '✓ Correct!' : `✗ Answer: ${q.correctAnswer}`}
                </Text>
              </View>
              <TouchableOpacity style={s.primaryBtn} onPress={next}>
                <Text style={s.primaryBtnText}>{currentIdx + 1 >= questions.length ? 'See Results' : 'Next →'}</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Menu
  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mini Games</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.subtitle}>Practice Marathi through fun games</Text>
        {GAME_TYPES.map(game => (
          <TouchableOpacity key={game.key} style={s.gameCard} onPress={() => startGame(game.key)}>
            <Text style={s.gameEmoji}>{game.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.gameLabel}>{game.label}</Text>
              <Text style={s.gameDesc}>{game.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FF6B35" />
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
  scroll: { padding: 16, paddingBottom: 40 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 16 },
  gameCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  gameEmoji: { fontSize: 36 },
  gameLabel: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  gameDesc: { fontSize: 13, color: '#888' },
  questionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  questionText: { fontSize: 16, fontWeight: '600', color: '#1a1a2e', lineHeight: 24 },
  marathiText: { fontSize: 28, fontWeight: '800', color: '#FF6B35', marginTop: 10, textAlign: 'center' },
  options: { gap: 10, marginBottom: 16 },
  optionBtn: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 14, padding: 14 },
  optionCorrect: { backgroundColor: '#dcfce7', borderColor: '#16a34a' },
  optionWrong: { backgroundColor: '#fee2e2', borderColor: '#dc2626' },
  optionText: { fontSize: 15, color: '#333', fontWeight: '500' },
  optionTextCorrect: { color: '#16a34a', fontWeight: '700' },
  feedbackBanner: { borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 12 },
  primaryBtn: { backgroundColor: '#FF6B35', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { backgroundColor: '#f0f0f0', borderRadius: 14, paddingVertical: 14, alignItems: 'center', width: '100%' },
  secondaryBtnText: { color: '#333', fontSize: 15, fontWeight: '600' },
  resultTitle: { fontSize: 26, fontWeight: '800', color: '#1a1a2e', marginBottom: 8 },
  resultScore: { fontSize: 64, fontWeight: '800', color: '#FF6B35' },
  resultSub: { fontSize: 15, color: '#888', marginBottom: 12 },
  xpBadge: { backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 6, fontSize: 15, fontWeight: '700', marginBottom: 24, overflow: 'hidden' },
});
