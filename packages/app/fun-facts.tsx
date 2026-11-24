import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@marathi-learning/shared';

const CATEGORIES = ['all', 'history', 'culture', 'food', 'festivals', 'geography', 'language'];
type View_ = 'today' | 'browse' | 'favorites';

export default function FunFactsScreen() {
  const router = useRouter();
  const [view, setView] = useState<View_>('today');
  const [todayFact, setTodayFact] = useState<any>(null);
  const [facts, setFacts] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [quizFact, setQuizFact] = useState<any>(null);
  const [quizAnswer, setQuizAnswer] = useState('');
  const [quizResult, setQuizResult] = useState<any>(null);

  useEffect(() => { loadToday(); }, []);

  async function api(path: string, opts?: RequestInit) {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}${path}`, {
      ...opts,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}`, ...(opts?.headers ?? {}) },
    });
    return res.json();
  }

  async function loadToday() {
    try {
      const data = await api('/api/fun-facts?action=today');
      setTodayFact(data);
    } finally {
      setLoading(false);
    }
  }

  async function loadBrowse() {
    setLoading(true);
    try {
      const data = await api(`/api/fun-facts?action=random${category !== 'all' ? `&category=${category}` : ''}`);
      setFacts(Array.isArray(data) ? data : [data]);
    } finally {
      setLoading(false);
    }
  }

  async function loadFavorites() {
    setLoading(true);
    try {
      const data = await api('/api/fun-facts?action=favorites');
      setFavorites(data.favorites ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite(factId: string) {
    await api('/api/fun-facts?action=toggle', { method: 'POST', body: JSON.stringify({ factId }) });
    if (view === 'favorites') loadFavorites();
    else if (view === 'today' && todayFact) setTodayFact((f: any) => ({ ...f, isFavorite: !f.isFavorite }));
  }

  async function submitQuiz() {
    if (!quizFact || !quizAnswer) return;
    const res = await api('/api/fun-facts?action=quiz', { method: 'POST', body: JSON.stringify({ answer: quizAnswer, correctAnswer: quizFact.quizAnswer }) });
    setQuizResult(res);
  }

  function switchView(v: View_) {
    setView(v);
    setLoading(true);
    if (v === 'today') loadToday();
    else if (v === 'browse') loadBrowse();
    else loadFavorites();
  }

  const displayFacts = view === 'favorites' ? favorites : facts;
  const filtered = search ? displayFacts.filter(f => f.title?.toLowerCase().includes(search.toLowerCase()) || f.content?.toLowerCase().includes(search.toLowerCase())) : displayFacts;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
        <Text style={s.headerTitle}>Fun Facts</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* View tabs */}
      <View style={s.tabs}>
        {(['today', 'browse', 'favorites'] as View_[]).map(v => (
          <TouchableOpacity key={v} style={[s.tab, view === v && s.tabActive]} onPress={() => switchView(v)}>
            <Text style={[s.tabText, view === v && s.tabTextActive]}>{v.charAt(0).toUpperCase() + v.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#FF6B35" /></View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>
          {/* Today's fact */}
          {view === 'today' && todayFact && (
            <View style={s.factCard}>
              <View style={s.factHeader}>
                <Text style={s.factCategory}>{todayFact.category}</Text>
                <TouchableOpacity onPress={() => toggleFavorite(todayFact.id)}>
                  <Ionicons name={todayFact.isFavorite ? 'heart' : 'heart-outline'} size={24} color="#FF6B35" />
                </TouchableOpacity>
              </View>
              <Text style={s.factTitle}>{todayFact.titleMarathi}</Text>
              <Text style={s.factTitleEn}>{todayFact.title}</Text>
              <Text style={s.factContent}>{todayFact.content}</Text>
              {todayFact.vocabulary?.length > 0 && (
                <View style={s.vocabRow}>
                  {todayFact.vocabulary.map((v: any, i: number) => (
                    <View key={i} style={s.vocabChip}>
                      <Text style={s.vocabWord}>{v.word}</Text>
                      <Text style={s.vocabMeaning}>{v.meaning}</Text>
                    </View>
                  ))}
                </View>
              )}
              {todayFact.quizQuestion && !quizFact && (
                <TouchableOpacity style={s.quizBtn} onPress={() => setQuizFact(todayFact)}>
                  <Text style={s.quizBtnText}>🧠 Take Mini Quiz</Text>
                </TouchableOpacity>
              )}
              {quizFact && !quizResult && (
                <View style={s.quizCard}>
                  <Text style={s.quizQuestion}>{quizFact.quizQuestion}</Text>
                  {quizFact.quizOptions?.map((opt: string) => (
                    <TouchableOpacity key={opt} style={[s.optionBtn, quizAnswer === opt && s.optionSelected]} onPress={() => setQuizAnswer(opt)}>
                      <Text style={[s.optionText, quizAnswer === opt && s.optionTextSelected]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={[s.primaryBtn, { opacity: quizAnswer ? 1 : 0.5 }]} onPress={submitQuiz} disabled={!quizAnswer}>
                    <Text style={s.primaryBtnText}>Submit</Text>
                  </TouchableOpacity>
                </View>
              )}
              {quizResult && (
                <View style={[s.quizResult, { backgroundColor: quizResult.correct ? '#dcfce7' : '#fee2e2' }]}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: quizResult.correct ? '#16a34a' : '#dc2626' }}>
                    {quizResult.correct ? '✓ Correct! +10 XP' : '✗ Not quite — keep learning!'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Browse / Favorites */}
          {(view === 'browse' || view === 'favorites') && (
            <>
              {view === 'browse' && (
                <>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll} contentContainerStyle={s.catContent}>
                    {CATEGORIES.map(cat => (
                      <TouchableOpacity key={cat} style={[s.catTab, category === cat && s.catTabActive]} onPress={() => { setCategory(cat); loadBrowse(); }}>
                        <Text style={[s.catTabText, category === cat && s.catTabTextActive]}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <View style={s.searchBar}>
                    <Ionicons name="search" size={18} color="#999" />
                    <TextInput style={s.searchInput} placeholder="Search facts..." value={search} onChangeText={setSearch} placeholderTextColor="#999" />
                  </View>
                </>
              )}
              {filtered.length === 0
                ? <Text style={s.empty}>{view === 'favorites' ? 'No favorites yet. Heart a fact to save it!' : 'No facts found.'}</Text>
                : filtered.map((fact: any) => (
                    <View key={fact.id} style={s.factCard}>
                      <View style={s.factHeader}>
                        <Text style={s.factCategory}>{fact.category}</Text>
                        <TouchableOpacity onPress={() => toggleFavorite(fact.id)}>
                          <Ionicons name={fact.isFavorite ? 'heart' : 'heart-outline'} size={22} color="#FF6B35" />
                        </TouchableOpacity>
                      </View>
                      <Text style={s.factTitle}>{fact.titleMarathi}</Text>
                      <Text style={s.factTitleEn}>{fact.title}</Text>
                      <Text style={s.factContent}>{fact.content}</Text>
                    </View>
                  ))
              }
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f0f0f0', alignItems: 'center' },
  tabActive: { backgroundColor: '#FF6B35' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#666' },
  tabTextActive: { color: '#fff' },
  scroll: { padding: 16, paddingBottom: 40 },
  factCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  factHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  factCategory: { fontSize: 11, fontWeight: '700', color: '#FF6B35', textTransform: 'uppercase', backgroundColor: '#fff3e0', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  factTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  factTitleEn: { fontSize: 14, color: '#888', marginBottom: 10 },
  factContent: { fontSize: 15, color: '#444', lineHeight: 22 },
  vocabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  vocabChip: { backgroundColor: '#f0f9ff', borderRadius: 10, padding: 8 },
  vocabWord: { fontSize: 14, fontWeight: '700', color: '#0369a1' },
  vocabMeaning: { fontSize: 11, color: '#666' },
  quizBtn: { marginTop: 12, backgroundColor: '#f0f9ff', borderRadius: 12, padding: 12, alignItems: 'center' },
  quizBtnText: { fontSize: 14, fontWeight: '700', color: '#0369a1' },
  quizCard: { marginTop: 12 },
  quizQuestion: { fontSize: 15, fontWeight: '600', color: '#1a1a2e', marginBottom: 12 },
  optionBtn: { backgroundColor: '#f8f9fa', borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginBottom: 8 },
  optionSelected: { backgroundColor: '#fff3e0', borderColor: '#FF6B35' },
  optionText: { fontSize: 14, color: '#333' },
  optionTextSelected: { color: '#FF6B35', fontWeight: '600' },
  primaryBtn: { backgroundColor: '#FF6B35', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  quizResult: { borderRadius: 12, padding: 14, marginTop: 8, alignItems: 'center' },
  catScroll: { maxHeight: 48, marginBottom: 12 },
  catContent: { paddingHorizontal: 0, gap: 8 },
  catTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f0f0f0' },
  catTabActive: { backgroundColor: '#FF6B35' },
  catTabText: { fontSize: 12, fontWeight: '600', color: '#666' },
  catTabTextActive: { color: '#fff' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  searchInput: { flex: 1, fontSize: 14, color: '#333' },
  empty: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 15 },
});
