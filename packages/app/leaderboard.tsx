import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@marathi-learning/shared';

export default function LeaderboardScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id ?? null);
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/gamification/leaderboard`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      setEntries(data.leaderboard ?? []);
    } finally {
      setLoading(false);
    }
  }

  const rankEmoji = (rank: number) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
        <Text style={s.headerTitle}>Leaderboard</Text>
        <View style={{ width: 24 }} />
      </View>
      <Text style={s.subtitle}>Weekly XP Rankings</Text>
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#FF6B35" /></View>
      ) : entries.length === 0 ? (
        <View style={s.center}><Text style={s.empty}>No rankings yet this week.</Text></View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={item => item.userId}
          contentContainerStyle={s.list}
          renderItem={({ item }) => {
            const isMe = item.userId === currentUserId;
            return (
              <View style={[s.row, isMe && s.rowMe]}>
                <Text style={[s.rank, item.rank <= 3 && s.rankTop]}>{rankEmoji(item.rank)}</Text>
                <View style={s.avatarCircle}>
                  <Text style={s.avatarInitial}>{(item.displayName || 'U')[0].toUpperCase()}</Text>
                </View>
                <View style={s.info}>
                  <Text style={s.name}>{item.displayName}{isMe ? ' (You)' : ''}</Text>
                  <Text style={s.level}>Level {item.level}</Text>
                </View>
                <Text style={s.xp}>{item.weeklyXp} XP</Text>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  subtitle: { fontSize: 13, color: '#888', textAlign: 'center', paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  list: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, gap: 12 },
  rowMe: { borderWidth: 2, borderColor: '#FF6B35', backgroundColor: '#fff8f5' },
  rank: { fontSize: 18, fontWeight: '800', color: '#888', minWidth: 36, textAlign: 'center' },
  rankTop: { fontSize: 22 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF6B35', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 18, fontWeight: '800', color: '#fff' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  level: { fontSize: 12, color: '#888', marginTop: 2 },
  xp: { fontSize: 15, fontWeight: '800', color: '#FF6B35' },
  empty: { fontSize: 16, color: '#888' },
});
