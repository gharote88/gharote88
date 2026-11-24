import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@marathi-learning/shared';

export default function ChallengeScreen() {
  const router = useRouter();
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => { load(); }, []);

  async function api(path: string, opts?: RequestInit) {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}${path}`, {
      ...opts,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}`, ...(opts?.headers ?? {}) },
    });
    return res.json();
  }

  async function load() {
    try {
      const data = await api('/api/gamification/challenge/today');
      setChallenge(data);
    } finally {
      setLoading(false);
    }
  }

  async function complete(score: number) {
    if (!challenge) return;
    setCompleting(true);
    try {
      const res = await api('/api/gamification/challenge/complete', {
        method: 'POST',
        body: JSON.stringify({ challengeId: challenge.id, score }),
      });
      setResult(res);
    } catch {
      Alert.alert('Error', 'Failed to complete challenge.');
    } finally {
      setCompleting(false);
    }
  }

  const typeIcon: Record<string, string> = { speaking: '🎤', writing: '✍️', reading: '📖', trivia: '🧠' };

  if (loading) return <SafeAreaView style={s.container}><View style={s.center}><ActivityIndicator size="large" color="#FF6B35" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
        <Text style={s.headerTitle}>Daily Challenge</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        {!challenge ? (
          <View style={s.center}><Text style={s.empty}>No challenge available today.</Text></View>
        ) : result ? (
          <View style={s.resultCard}>
            <Text style={s.resultEmoji}>🎉</Text>
            <Text style={s.resultTitle}>Challenge Complete!</Text>
            <Text style={s.resultXp}>+{result.xpAwarded ?? 40} XP earned</Text>
            {result.bonusXp > 0 && <Text style={s.resultBonus}>+{result.bonusXp} bonus XP for perfect score!</Text>}
            <TouchableOpacity style={s.primaryBtn} onPress={() => router.push('/dashboard')}>
              <Text style={s.primaryBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={s.challengeCard}>
              <View style={s.challengeHeader}>
                <Text style={s.challengeType}>{typeIcon[challenge.type] ?? '⚡'} {challenge.type?.charAt(0).toUpperCase() + challenge.type?.slice(1)}</Text>
                <View style={s.xpBadge}><Text style={s.xpBadgeText}>+{challenge.xpReward ?? 40} XP</Text></View>
              </View>
              <Text style={s.challengeTitle}>{challenge.title}</Text>
              <Text style={s.challengeDesc}>{challenge.description}</Text>
              {challenge.targetText && (
                <View style={s.targetBox}>
                  <Text style={s.targetLabel}>Target:</Text>
                  <Text style={s.targetText}>{challenge.targetText}</Text>
                  {challenge.transliteration && <Text style={s.targetRoman}>{challenge.transliteration}</Text>}
                </View>
              )}
            </View>

            {challenge.completed ? (
              <View style={s.completedBanner}>
                <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
                <Text style={s.completedText}>Already completed today!</Text>
              </View>
            ) : (
              <View style={s.actionCard}>
                <Text style={s.actionTitle}>Complete this challenge to earn XP</Text>
                <TouchableOpacity
                  style={s.primaryBtn}
                  onPress={() => {
                    if (challenge.type === 'speaking') router.push({ pathname: '/practice', params: { mode: 'speaking' } });
                    else if (challenge.type === 'writing') router.push({ pathname: '/practice', params: { mode: 'writing' } });
                    else if (challenge.type === 'reading') router.push({ pathname: '/practice', params: { mode: 'reading' } });
                    else complete(100);
                  }}
                  disabled={completing}
                >
                  {completing ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Start Challenge →</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={s.secondaryBtn} onPress={() => complete(80)}>
                  <Text style={s.secondaryBtnText}>Mark as Done (80%)</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  scroll: { padding: 16, paddingBottom: 40 },
  challengeCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  challengeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  challengeType: { fontSize: 14, fontWeight: '700', color: '#FF6B35' },
  xpBadge: { backgroundColor: '#dcfce7', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  xpBadgeText: { fontSize: 13, fontWeight: '700', color: '#16a34a' },
  challengeTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e', marginBottom: 8 },
  challengeDesc: { fontSize: 15, color: '#555', lineHeight: 22, marginBottom: 12 },
  targetBox: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 14, borderLeftWidth: 4, borderLeftColor: '#FF6B35' },
  targetLabel: { fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 4 },
  targetText: { fontSize: 24, fontWeight: '800', color: '#1a1a2e' },
  targetRoman: { fontSize: 14, color: '#FF6B35', marginTop: 4 },
  completedBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#dcfce7', borderRadius: 14, padding: 16 },
  completedText: { fontSize: 15, fontWeight: '700', color: '#16a34a' },
  actionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  actionTitle: { fontSize: 15, color: '#555', marginBottom: 16, textAlign: 'center' },
  primaryBtn: { backgroundColor: '#FF6B35', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { backgroundColor: '#f0f0f0', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  secondaryBtnText: { color: '#555', fontSize: 15, fontWeight: '600' },
  resultCard: { alignItems: 'center', padding: 24 },
  resultEmoji: { fontSize: 64, marginBottom: 12 },
  resultTitle: { fontSize: 26, fontWeight: '800', color: '#1a1a2e', marginBottom: 8 },
  resultXp: { fontSize: 20, fontWeight: '700', color: '#16a34a', marginBottom: 4 },
  resultBonus: { fontSize: 14, color: '#FF6B35', marginBottom: 24 },
  empty: { fontSize: 16, color: '#888' },
});
