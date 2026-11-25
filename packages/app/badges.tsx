import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@marathi-learning/shared';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  earned: boolean;
  earnedAt?: string;
}

export default function BadgesScreen() {
  const router = useRouter();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/gamification/badges`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      setBadges(data.badges ?? []);
    } finally {
      setLoading(false);
    }
  }

  const earned = badges.filter(b => b.earned);
  const locked = badges.filter(b => !b.earned);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Badges</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#FF6B35" /></View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.summary}>
            <Text style={s.summaryCount}>{earned.length}</Text>
            <Text style={s.summaryLabel}>of {badges.length} badges earned</Text>
          </View>

          {earned.length > 0 && (
            <>
              <Text style={s.sectionLabel}>Earned</Text>
              <View style={s.grid}>
                {earned.map(b => (
                  <View key={b.id} style={[s.badgeCard, s.badgeEarned]}>
                    <Text style={s.badgeIcon}>{b.icon}</Text>
                    <Text style={s.badgeName}>{b.name}</Text>
                    <Text style={s.badgeDesc}>{b.description}</Text>
                    <Text style={s.badgeXp}>+{b.xpReward} XP</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {locked.length > 0 && (
            <>
              <Text style={s.sectionLabel}>Locked</Text>
              <View style={s.grid}>
                {locked.map(b => (
                  <View key={b.id} style={[s.badgeCard, s.badgeLocked]}>
                    <Text style={[s.badgeIcon, s.badgeIconLocked]}>🔒</Text>
                    <Text style={[s.badgeName, s.badgeNameLocked]}>{b.name}</Text>
                    <Text style={s.badgeDesc}>{b.description}</Text>
                  </View>
                ))}
              </View>
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
  scroll: { padding: 16, paddingBottom: 40 },
  summary: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  summaryCount: { fontSize: 48, fontWeight: '800', color: '#FF6B35' },
  summaryLabel: { fontSize: 14, color: '#888', marginTop: 4 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  badgeCard: { width: '47%', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  badgeEarned: { backgroundColor: '#fff' },
  badgeLocked: { backgroundColor: '#f0f0f0' },
  badgeIcon: { fontSize: 36, marginBottom: 8 },
  badgeIconLocked: { opacity: 0.4 },
  badgeName: { fontSize: 13, fontWeight: '700', color: '#1a1a2e', textAlign: 'center', marginBottom: 4 },
  badgeNameLocked: { color: '#aaa' },
  badgeDesc: { fontSize: 11, color: '#888', textAlign: 'center', lineHeight: 16 },
  badgeXp: { fontSize: 12, fontWeight: '700', color: '#16a34a', marginTop: 6, backgroundColor: '#dcfce7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2 },
});
