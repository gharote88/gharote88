import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SpeakingPractice from './src/components/SpeakingPractice';
import WritingPractice from './src/components/WritingPractice';
import { supabase } from '@marathi-learning/shared';

type Tab = 'speaking' | 'writing' | 'reading';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'speaking', label: 'Speaking', icon: 'mic' },
  { key: 'writing', label: 'Writing', icon: 'create' },
  { key: 'reading', label: 'Reading', icon: 'book' },
];

export default function PracticeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: Tab; lessonId?: string }>();
  const [tab, setTab] = useState<Tab>(params.mode ?? 'speaking');
  const [phrases, setPhrases] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [passages, setPassages] = useState<any[]>([]);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState<Tab | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  // Reading state
  const [readingLevel, setReadingLevel] = useState('beginner');
  const [selectedPassage, setSelectedPassage] = useState<any>(null);
  const [vocabPopup, setVocabPopup] = useState<any>(null);
  const [quizView, setQuizView] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<any>(null);

  async function loadTab(t: Tab) {
    if (loaded === t) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const base = process.env.EXPO_PUBLIC_API_BASE_URL;
      const headers = { Authorization: `Bearer ${session?.access_token}` };

      if (t === 'speaking') {
        const res = await fetch(`${base}/api/lessons?level=beginner&limit=1`, { headers });
        const data = await res.json();
        const lessonId = params.lessonId ?? data.lessons?.[0]?.id;
        if (lessonId) {
          const lr = await fetch(`${base}/api/lessons/${lessonId}`, { headers });
          const ld = await lr.json();
          setPhrases(ld.phrases ?? []);
        }
      } else if (t === 'writing') {
        const res = await fetch(`${base}/api/writing/characters?level=beginner`, { headers });
        const data = await res.json();
        setCharacters(data.characters ?? []);
      } else {
        const res = await fetch(`${base}/api/reading/passages?level=${readingLevel}`, { headers });
        const data = await res.json();
        setPassages(data.passages ?? []);
      }
      setLoaded(t);
    } catch {
      Alert.alert('Error', 'Failed to load practice content.');
    } finally {
      setLoading(false);
    }
  }

  function switchTab(t: Tab) {
    setTab(t);
    setDone(false);
    setScores([]);
    setPhraseIdx(0);
    setCharIdx(0);
    setSelectedPassage(null);
    setQuizView(false);
    setQuizResult(null);
    loadTab(t);
  }

  // Speaking handlers
  function onSpeakComplete(score: number) {
    setScores(s => [...s, score]);
  }
  function onSpeakNext() {
    if (phraseIdx + 1 >= phrases.length) { setDone(true); return; }
    setPhraseIdx(i => i + 1);
  }

  // Writing handlers
  function onWriteComplete(score: number) {
    setScores(s => [...s, score]);
  }
  function onWriteNext() {
    if (charIdx + 1 >= characters.length) { setDone(true); return; }
    setCharIdx(i => i + 1);
  }

  // Reading handlers
  async function openPassage(p: any) {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/reading/passages/${p.id}`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      setSelectedPassage(await res.json());
    } catch {
      Alert.alert('Error', 'Failed to load passage.');
    } finally {
      setLoading(false);
    }
  }

  async function submitQuiz() {
    if (!selectedPassage) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const answerArr = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }));
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/reading/comprehension`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ passageId: selectedPassage.id, answers: answerArr }),
      });
      setQuizResult(await res.json());
    } catch {
      setQuizResult({ score: 0 });
    }
  }

  // Done screen
  if (done) {
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.doneContainer}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>Practice Complete!</Text>
          <Text style={styles.doneScore}>{avg}%</Text>
          <Text style={styles.doneLabel}>Average Score</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => { setDone(false); setScores([]); setPhraseIdx(0); setCharIdx(0); }}>
            <Text style={styles.primaryBtnText}>Practice Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/dashboard')}>
            <Text style={styles.secondaryBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Practice</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => switchTab(t.key)}
          >
            <Ionicons name={t.icon as any} size={18} color={tab === t.key ? '#fff' : '#666'} />
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      ) : (
        <>
          {/* Speaking */}
          {tab === 'speaking' && (
            phrases.length === 0
              ? <View style={styles.center}><Text style={styles.emptyText}>No phrases available.</Text>
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => loadTab('speaking')}>
                    <Text style={styles.primaryBtnText}>Load Phrases</Text>
                  </TouchableOpacity>
                </View>
              : <SpeakingPractice
                  phrase={phrases[phraseIdx]}
                  onComplete={onSpeakComplete}
                  onNext={onSpeakNext}
                />
          )}

          {/* Writing */}
          {tab === 'writing' && (
            characters.length === 0
              ? <View style={styles.center}><Text style={styles.emptyText}>No characters available.</Text>
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => loadTab('writing')}>
                    <Text style={styles.primaryBtnText}>Load Characters</Text>
                  </TouchableOpacity>
                </View>
              : <WritingPractice
                  exercise={characters[charIdx]}
                  onComplete={onWriteComplete}
                  onNext={onWriteNext}
                />
          )}

          {/* Reading */}
          {tab === 'reading' && !selectedPassage && (
            <ScrollView style={styles.scroll}>
              <View style={styles.levelTabs}>
                {['beginner', 'intermediate', 'advanced'].map(l => (
                  <TouchableOpacity
                    key={l}
                    style={[styles.levelTab, readingLevel === l && styles.levelTabActive]}
                    onPress={() => { setReadingLevel(l); setLoaded(null); loadTab('reading'); }}
                  >
                    <Text style={[styles.levelTabText, readingLevel === l && styles.levelTabTextActive]}>
                      {l.charAt(0).toUpperCase() + l.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {passages.length === 0
                ? <Text style={styles.emptyText}>No passages available.</Text>
                : passages.map(p => (
                    <TouchableOpacity key={p.id} style={styles.passageRow} onPress={() => openPassage(p)}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.passageTitle}>{p.title}</Text>
                        <Text style={styles.passageMeta}>{p.level} · {p.wordCount} words</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#FF6B35" />
                    </TouchableOpacity>
                  ))
              }
            </ScrollView>
          )}

          {tab === 'reading' && selectedPassage && !quizView && !quizResult && (
            <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16 }}>
              <TouchableOpacity onPress={() => setSelectedPassage(null)} style={styles.backRow}>
                <Ionicons name="arrow-back" size={18} color="#FF6B35" />
                <Text style={styles.backRowText}>Passages</Text>
              </TouchableOpacity>
              <Text style={styles.passageContent}>{selectedPassage.contentMarathi}</Text>
              <Text style={styles.passageEnglish}>{selectedPassage.contentEnglish}</Text>
              {selectedPassage.vocabulary?.length > 0 && (
                <View style={styles.vocabSection}>
                  <Text style={styles.vocabLabel}>Vocabulary</Text>
                  <View style={styles.vocabChips}>
                    {selectedPassage.vocabulary.map((v: any, i: number) => (
                      <TouchableOpacity key={i} style={styles.vocabChip} onPress={() => setVocabPopup(v)}>
                        <Text style={styles.vocabChipText}>{v.word}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              {selectedPassage.questions?.length > 0 && (
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setQuizView(true)}>
                  <Text style={styles.primaryBtnText}>Take Comprehension Quiz →</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}

          {tab === 'reading' && quizView && !quizResult && selectedPassage && (
            <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16 }}>
              <TouchableOpacity onPress={() => setQuizView(false)} style={styles.backRow}>
                <Ionicons name="arrow-back" size={18} color="#FF6B35" />
                <Text style={styles.backRowText}>Back to Passage</Text>
              </TouchableOpacity>
              {selectedPassage.questions.map((q: any, qi: number) => (
                <View key={q.id} style={styles.questionCard}>
                  <Text style={styles.questionText}>{qi + 1}. {q.question}</Text>
                  {(q.options ?? (q.type === 'true_false' ? ['True', 'False'] : [])).map((opt: string) => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.optionBtn, answers[q.id] === opt && styles.optionSelected]}
                      onPress={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                    >
                      <Text style={[styles.optionText, answers[q.id] === opt && styles.optionTextSelected]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
              <TouchableOpacity
                style={[styles.primaryBtn, { opacity: Object.keys(answers).length < selectedPassage.questions.length ? 0.5 : 1 }]}
                onPress={submitQuiz}
                disabled={Object.keys(answers).length < selectedPassage.questions.length}
              >
                <Text style={styles.primaryBtnText}>Submit Answers</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {tab === 'reading' && quizResult && (
            <View style={styles.center}>
              <Text style={styles.doneEmoji}>📖</Text>
              <Text style={styles.doneScore}>{quizResult.score ?? 0}</Text>
              <Text style={styles.doneLabel}>/100</Text>
              <Text style={styles.doneTitle}>{(quizResult.score ?? 0) >= 70 ? '🎉 Great job!' : 'Keep reading!'}</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => { setSelectedPassage(null); setQuizView(false); setQuizResult(null); setAnswers({}); }}>
                <Text style={styles.primaryBtnText}>Back to Passages</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Vocab popup */}
      <Modal visible={!!vocabPopup} transparent animationType="fade" onRequestClose={() => setVocabPopup(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVocabPopup(null)}>
          <View style={styles.popupCard}>
            <Text style={styles.popupWord}>{vocabPopup?.word}</Text>
            <Text style={styles.popupRoman}>{vocabPopup?.transliteration}</Text>
            <Text style={styles.popupMeaning}>{vocabPopup?.meaning}</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setVocabPopup(null)}>
              <Text style={styles.primaryBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f0f0f0' },
  tabActive: { backgroundColor: '#FF6B35' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#666' },
  tabTextActive: { color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  scroll: { flex: 1 },
  emptyText: { fontSize: 16, color: '#888', textAlign: 'center', marginBottom: 16 },
  levelTabs: { flexDirection: 'row', gap: 8, padding: 16 },
  levelTab: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  levelTabActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  levelTabText: { fontSize: 13, fontWeight: '600', color: '#666' },
  levelTabTextActive: { color: '#fff' },
  passageRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  passageTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  passageMeta: { fontSize: 12, color: '#888', textTransform: 'capitalize' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backRowText: { fontSize: 14, color: '#FF6B35', fontWeight: '600' },
  passageContent: { fontSize: 20, lineHeight: 32, color: '#1a1a2e', marginBottom: 12 },
  passageEnglish: { fontSize: 14, color: '#666', lineHeight: 22, marginBottom: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
  vocabSection: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16 },
  vocabLabel: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 10 },
  vocabChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vocabChip: { backgroundColor: '#fff3e0', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  vocabChipText: { fontSize: 14, color: '#FF6B35', fontWeight: '600' },
  questionCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12 },
  questionText: { fontSize: 15, fontWeight: '600', color: '#1a1a2e', marginBottom: 12 },
  optionBtn: { backgroundColor: '#f8f9fa', borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginBottom: 8 },
  optionSelected: { backgroundColor: '#fff3e0', borderColor: '#FF6B35' },
  optionText: { fontSize: 14, color: '#333' },
  optionTextSelected: { color: '#FF6B35', fontWeight: '600' },
  doneContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  doneEmoji: { fontSize: 56, marginBottom: 12 },
  doneTitle: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', marginBottom: 8 },
  doneScore: { fontSize: 64, fontWeight: '800', color: '#FF6B35' },
  doneLabel: { fontSize: 14, color: '#888', marginBottom: 24 },
  primaryBtn: { backgroundColor: '#FF6B35', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center', width: '100%', marginBottom: 12 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { backgroundColor: '#f0f0f0', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center', width: '100%' },
  secondaryBtnText: { color: '#333', fontSize: 16, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  popupCard: { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '80%', alignItems: 'center' },
  popupWord: { fontSize: 36, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 },
  popupRoman: { fontSize: 16, color: '#888', marginBottom: 8 },
  popupMeaning: { fontSize: 15, color: '#444', marginBottom: 20, textAlign: 'center', lineHeight: 22 },
});
