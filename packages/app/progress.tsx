import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@marathi-learning/shared';

export default function ProgressScreen() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [streak, setStreak] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [xp, setXp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const base = process.env.EXPO_PUBLIC_API_BASE_URL;
      const h = { Authorization: `Bearer ${session?.access_token}` };
      const [dash, str, bdg, xpData] = await Promise.all([
        fetch(`${base}/api/progress/dashboard`, { headers: h }).then(r => r.json()),
        fetch(`${base}/api/gamification/streak/get`, { headers: h }).then(r => r.json()),
        fetch(`${base}/api/gamification/badges/get`, { headers: h }).then(r => r.json()),
        fetch(`${base}/api/gamification/xp/get`, { headers: h }).then(r => r.json()),
      ]);
      setDashboard(dash);
      setStreak(str);
      setBadges(bdg.badges ?? []);
      setXp(xpData);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <SafeAreaView style={s.container}>
      <View style={s.center}><ActivityIndicator size="large" color="#FF6B35" /></View>
    </SafeAreaView>
  );

  const earned = badges.filter(b => b.earned);
  const locked = badges.filter(b => !b.earned);
  const today = new Date();
  const calDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    return { date: d.getDate(), active: streak?.activityDates?.includes(d.toISOString().slice(0, 10)) ?? false };
  });

  const skills = [
    { label: 'Speaking', icon: '🎤', value: `${dashboard?.speakingAvgScore ?? 0}%`, sub: 'avg accuracy' },
    { label: 'Writing', icon: '✍️', value: `${dashboard?.charactersMastered ?? 0}`, sub: 'chars mastered' },
    { label: 'Reading', icon: '📖', value: `${dashboard?.avgWpm ?? 0} WPM`, sub: 'avg speed' },
    { label: 'Comprehension', icon: '🧠', value: `${dashboard?.comprehensionAvg ?? 0}%`, sub: 'avg score' },
  ];

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Progress</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Overview */}
        <View style={s.overviewCard}>
          <View style={s.overviewRow}>
            {[
              { val: xp?.totalXp ?? 0, label: 'Total XP' },
              { val: `Lv ${xp?.level ?? 1}`, label: xp?.levelTitle ?? 'Beginner' },
              { val: dashboard?.lessonsCompleted ?? 0, label: 'Lessons' },
            ].map((item, i, arr) => (
              <View key={item.label} style={s.overviewGroup}>
                <View style={s.overviewStat}>
                  <Text style={s.overviewVal}>{item.val}</Text>
                  <Text style={s.overviewLabel}>{item.label}</Text>
                </View>
                {i < arr.length - 1 && <View style={s.divider} />}
              </View>
            ))}
          </View>
          <View style={s.streakRow}>
            <Text style={s.streakFire}>🔥</Text>
            <Text style={s.streakVal}>{streak?.currentStreak ?? 0} day streak</Text>
            <Text style={s.streakBest}>Best: {streak?.longestStreak ?? 0}</Text>
          </View>
        </View>

        {/* Skills */}
        <Text style={s.sectionLabel}>Skill Breakdown</Text>
        <View style={s.skillGrid}>
          {skills.map(sk => (
            <View key={sk.label} style={s.skillCard}>
              <Text style={s.skillIcon}>{sk.icon}</Text>
              <Text style={s.skillVal}>{sk.value}</Text>
              <Text style={s.skillLabel}>{sk.label}</Text>
              <Text style={s.skillSub}>{sk.sub}</Text>
            </View>
          ))}
        </View>

        {/* 30-day calendar */}
        <Text style={s.sectionLabel}>30-Day Activity</Text>
        <View style={s.calCard}>
          <View style={s.calGrid}>
            {calDays.map((d, i) => (
              <View key={i} style={[s.calDay, d.active && s.calDayActive]}>
                <Text style={s.calDayNum}>{d.date}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Badges */}
        <Text style={s.sectionLabel}>Badges ({earned.length}/{badges.length})</Text>
        <View style={s.badgeGrid}>
          {earned.map(b => (
            <View key={b.id} style={s.badgeCard}>
              <Text style={s.badgeIcon}>{b.icon ?? '🏅'}</Text>
              <Text style={s.badgeName}>{b.name}</Text>
            </View>
          ))}
          {locked.map(b => (
            <View key={b.id} style={[s.badgeCard, s.badgeLocked]}>
              <Text style={s.badgeIcon}>🔒</Text>
              <Text style={s.badgeName}>{b.name}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        {dashboard?.nextLesson && (
          <TouchableOpacity style={s.ctaCard} onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: dashboard.nextLesson.id } })}>
            <View style={{ flex: 1 }}>
              <Text style={s.ctaLabel}>Continue Learning</Text>
              <Text style={s.ctaTitle}>{dashboard.nextLesson.title}</Text>
            </View>
            <Ionicons name="arrow-forward" size={22} color="#FF6B35" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  scroll: { padding: 16, paddingBottom: 40 },
  overviewCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  overviewRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  overviewGroup: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  overviewStat: { flex: 1, alignItems: 'center' },
  overviewVal: { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  overviewLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  divider: { width: 1, height: 40, backgroundColor: '#f0f0f0' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff8f0', borderRadius: 12, padding: 12 },
  streakFire: { fontSize: 20 },
  streakVal: { flex: 1, fontSize: 15, fontWeight: '700', color: '#FF6B35' },
  streakBest: { fontSize: 12, color: '#888' },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
  skillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  skillCard: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  skillIcon: { fontSize: 24, marginBottom: 4 },
  skillVal: { fontSize: 20, fontWeight: '800', color: '#1a1a2e' },
  skillLabel: { fontSize: 13, fontWeight: '600', color: '#444' },
  skillSub: { fontSize: 11, color: '#aaa' },
  calCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  calDay: { width: '9%', aspectRatio: 1, borderRadius: 6, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  calDayActive: { backgroundColor: '#FF6B35' },
  calDayNum: { fontSize: 8, color: '#fff', fontWeight: '600' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  badgeCard: { width: '30%', backgroundColor: '#fff', borderRadius: 16, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  badgeLocked: { opacity: 0.5 },
  badgeIcon: { fontSize: 28, marginBottom: 4 },
  badgeName: { fontSize: 10, fontWeight: '600', color: '#444', textAlign: 'center' },
  ctaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 2, borderColor: '#FF6B35', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  ctaLabel: { fontSize: 11, color: '#FF6B35', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  ctaTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
});
