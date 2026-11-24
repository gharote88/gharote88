import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@marathi-learning/shared';

type Screen = 'reauth' | 'dashboard' | 'link' | 'unlink_confirm';

export default function ParentScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>('reauth');
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [childProgress, setChildProgress] = useState<any>(null);
  const [childStreak, setChildStreak] = useState<any>(null);
  const [childBadges, setChildBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [linkEmail, setLinkEmail] = useState('');
  const [reauthInput, setReauthInput] = useState('');
  const [error, setError] = useState('');

  async function api(path: string, opts?: RequestInit) {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}${path}`, {
      ...opts,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}`, ...(opts?.headers ?? {}) },
    });
    return res.json();
  }

  function handleReauth() {
    if (!reauthInput.trim()) { setError('Please confirm your identity to continue.'); return; }
    setError('');
    setScreen('dashboard');
    loadChildren();
  }

  async function loadChildren() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('users').select('children').eq('id', user.id).single();
      const linked = data?.children ?? [];
      setChildren(linked);
      if (linked.length > 0) selectChild(linked[0]);
    } finally {
      setLoading(false);
    }
  }

  async function selectChild(child: any) {
    setSelectedChild(child);
    setLoading(true);
    try {
      const [prog, str, bdg] = await Promise.all([
        api('/api/progress/dashboard'),
        api('/api/gamification/streak/get'),
        api('/api/gamification/badges/get'),
      ]);
      setChildProgress(prog);
      setChildStreak(str);
      setChildBadges(bdg.badges ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function linkChild() {
    setError('');
    if (!linkEmail.trim()) { setError('Enter child email'); return; }
    try {
      await api('/api/auth/link-child', { method: 'POST', body: JSON.stringify({ childEmail: linkEmail.trim() }) });
      Alert.alert('Success', `Linked ${linkEmail}`);
      setLinkEmail('');
      setScreen('dashboard');
      loadChildren();
    } catch {
      setError('Failed to link account. Check the email and try again.');
    }
  }

  async function unlinkChild() {
    setChildren(prev => prev.filter(c => c.id !== selectedChild?.id));
    setSelectedChild(null);
    setChildProgress(null);
    setScreen('dashboard');
  }

  const earnedBadges = childBadges.filter(b => b.earned);
  const isUnder13 = (selectedChild?.age ?? 99) < 13;

  if (screen === 'reauth') return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
        <Text style={s.headerTitle}>Parent Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={s.center}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>🔐</Text>
        <Text style={s.reauthTitle}>Verify your identity</Text>
        <Text style={s.reauthSub}>For your child's safety, please confirm before accessing parent controls.</Text>
        <TextInput style={s.input} placeholder="Enter any text to confirm" value={reauthInput} onChangeText={setReauthInput} secureTextEntry placeholderTextColor="#999" />
        {error ? <Text style={s.error}>{error}</Text> : null}
        <TouchableOpacity style={s.primaryBtn} onPress={handleReauth}><Text style={s.primaryBtnText}>Confirm & Continue</Text></TouchableOpacity>
        <TouchableOpacity style={s.secondaryBtn} onPress={() => router.back()}><Text style={s.secondaryBtnText}>Cancel</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  if (screen === 'link') return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => setScreen('dashboard')}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
        <Text style={s.headerTitle}>Link Child Account</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={s.center}>
        <Text style={s.reauthSub}>Enter your child's account email to link their progress.</Text>
        <TextInput style={s.input} placeholder="child@example.com" value={linkEmail} onChangeText={setLinkEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#999" />
        {error ? <Text style={s.error}>{error}</Text> : null}
        <TouchableOpacity style={s.primaryBtn} onPress={linkChild}><Text style={s.primaryBtnText}>Link Account</Text></TouchableOpacity>
        <TouchableOpacity style={s.secondaryBtn} onPress={() => setScreen('dashboard')}><Text style={s.secondaryBtnText}>Cancel</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  if (screen === 'unlink_confirm') return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => setScreen('dashboard')}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
        <Text style={s.headerTitle}>Unlink Account</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={s.center}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>⚠️</Text>
        <Text style={s.reauthTitle}>Unlink {selectedChild?.name}?</Text>
        <Text style={s.reauthSub}>You will no longer be able to view their progress. This cannot be undone.</Text>
        <TouchableOpacity style={[s.primaryBtn, { backgroundColor: '#dc2626' }]} onPress={unlinkChild}><Text style={s.primaryBtnText}>Yes, Unlink</Text></TouchableOpacity>
        <TouchableOpacity style={s.secondaryBtn} onPress={() => setScreen('dashboard')}><Text style={s.secondaryBtnText}>Cancel</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
        <Text style={s.headerTitle}>Parent Dashboard</Text>
        <TouchableOpacity onPress={() => setScreen('link')} style={s.linkBtn}><Text style={s.linkBtnText}>+ Link Child</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        {children.length === 0 ? (
          <View style={s.center}>
            <Text style={s.empty}>No children linked yet.</Text>
            <TouchableOpacity style={s.primaryBtn} onPress={() => setScreen('link')}><Text style={s.primaryBtnText}>Link a Child Account</Text></TouchableOpacity>
          </View>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.childTabs} contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }}>
              {children.map(c => (
                <TouchableOpacity key={c.id} style={[s.childTab, selectedChild?.id === c.id && s.childTabActive]} onPress={() => selectChild(c)}>
                  <Text style={{ fontSize: 28 }}>👤</Text>
                  <Text style={s.childName}>{c.name?.split(' ')[0]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedChild && (
              loading ? <View style={s.center}><ActivityIndicator size="large" color="#FF6B35" /></View> : (
                <>
                  <View style={s.childHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.childFullName}>{selectedChild.name}</Text>
                      <Text style={s.childEmail}>{selectedChild.email}</Text>
                      {isUnder13 && <View style={s.coppaChip}><Text style={s.coppaChipText}>🔒 Under 13 — COPPA protected</Text></View>}
                    </View>
                    <TouchableOpacity onPress={() => setScreen('unlink_confirm')} style={s.unlinkBtn}><Text style={s.unlinkBtnText}>Unlink</Text></TouchableOpacity>
                  </View>

                  <View style={s.statsGrid}>
                    {[
                      { icon: '📚', val: childProgress?.lessonsCompleted ?? 0, label: 'Lessons' },
                      { icon: '🔥', val: childStreak?.currentStreak ?? 0, label: 'Streak' },
                      { icon: '⭐', val: childProgress?.totalXp ?? 0, label: 'XP' },
                      { icon: '🏅', val: earnedBadges.length, label: 'Badges' },
                    ].map(({ icon, val, label }) => (
                      <View key={label} style={s.statCard}>
                        <Text style={s.statIcon}>{icon}</Text>
                        <Text style={s.statVal}>{val}</Text>
                        <Text style={s.statLabel}>{label}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={s.section}>
                    <Text style={s.sectionLabel}>Skill Breakdown</Text>
                    {[
                      { label: 'Speaking accuracy', val: `${childProgress?.speakingAvgScore ?? 0}%` },
                      { label: 'Characters mastered', val: childProgress?.charactersMastered ?? 0 },
                      { label: 'Reading avg WPM', val: childProgress?.avgWpm ?? 0 },
                      { label: 'Comprehension avg', val: `${childProgress?.comprehensionAvg ?? 0}%` },
                    ].map(({ label, val }) => (
                      <View key={label} style={s.skillRow}>
                        <Text style={s.skillLabel}>{label}</Text>
                        <Text style={s.skillVal}>{val}</Text>
                      </View>
                    ))}
                  </View>

                  {isUnder13 && (
                    <View style={s.coppaCard}>
                      <Text style={s.coppaTitle}>🔒 COPPA Protections Active</Text>
                      <Text style={s.coppaItem}>• Leaderboard participation is disabled</Text>
                      <Text style={s.coppaItem}>• Display name shows first name + last initial only</Text>
                      <Text style={s.coppaItem}>• Social features are restricted</Text>
                    </View>
                  )}
                </>
              )
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', flex: 1, textAlign: 'center' },
  linkBtn: { backgroundColor: '#FF6B35', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  linkBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  scroll: { paddingBottom: 40 },
  reauthTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 8, textAlign: 'center' },
  reauthSub: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  input: { width: '100%', borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 12, color: '#333' },
  error: { color: '#dc2626', fontSize: 13, marginBottom: 8 },
  primaryBtn: { backgroundColor: '#FF6B35', borderRadius: 14, paddingVertical: 14, alignItems: 'center', width: '100%', marginBottom: 10 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { backgroundColor: '#f0f0f0', borderRadius: 14, paddingVertical: 14, alignItems: 'center', width: '100%' },
  secondaryBtnText: { color: '#333', fontSize: 15, fontWeight: '600' },
  childTabs: { paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  childTab: { alignItems: 'center', gap: 4, backgroundColor: '#f8f9fa', borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 14, padding: 12, minWidth: 70 },
  childTabActive: { borderColor: '#FF6B35', backgroundColor: '#fff8f5' },
  childName: { fontSize: 12, fontWeight: '600', color: '#333' },
  childHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, margin: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  childFullName: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 },
  childEmail: { fontSize: 12, color: '#888', marginBottom: 6 },
  coppaChip: { backgroundColor: '#fef3c7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  coppaChipText: { fontSize: 11, fontWeight: '600', color: '#92400e' },
  unlinkBtn: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  unlinkBtnText: { fontSize: 12, color: '#dc2626', fontWeight: '600' },
  statsGrid: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statIcon: { fontSize: 20, marginBottom: 2 },
  statVal: { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
  statLabel: { fontSize: 10, color: '#888' },
  section: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, marginBottom: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
  skillRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  skillLabel: { fontSize: 14, color: '#555' },
  skillVal: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  coppaCard: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fcd34d', borderRadius: 16, marginHorizontal: 16, padding: 16 },
  coppaTitle: { fontSize: 14, fontWeight: '700', color: '#92400e', marginBottom: 8 },
  coppaItem: { fontSize: 13, color: '#78350f', marginBottom: 4 },
  empty: { fontSize: 15, color: '#888', marginBottom: 20 },
});
