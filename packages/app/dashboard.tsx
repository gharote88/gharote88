import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase, signOut } from '@marathi-learning/shared';
import JourneyMap from './src/components/JourneyMap';

export default function Dashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [totalXp, setTotalXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('users')
        .select('name, total_xp, level, current_streak')
        .eq('id', user.id)
        .single();
      if (data) {
        setUserName(data.name);
        setTotalXp(data.total_xp);
        setLevel(data.level);
        setStreak(data.current_streak);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>नमस्कार, {userName || 'Learner'}! 👋</Text>
          <Text style={styles.subGreeting}>Continue your journey</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{(userName || 'L')[0].toUpperCase()}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalXp}</Text>
          <Text style={styles.statLabel}>XP</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{level}</Text>
          <Text style={styles.statLabel}>Level</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{streak}🔥</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>

      {/* Journey Map */}
      <Text style={styles.sectionTitle}>Your Journey</Text>
      <JourneyMap />

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/lessons')}>
          <Text style={styles.actionEmoji}>📚</Text>
          <Text style={styles.actionLabel}>Lessons</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/practice')}>
          <Text style={styles.actionEmoji}>🎤</Text>
          <Text style={styles.actionLabel}>Practice</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/profile')}>
          <Text style={styles.actionEmoji}>👤</Text>
          <Text style={styles.actionLabel}>Profile</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={() => signOut()}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FF6B35', padding: 20, paddingTop: 50,
  },
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  subGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  statsRow: { flexDirection: 'row', margin: 16, gap: 12 },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12,
    padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#FF6B35' },
  statLabel: { fontSize: 12, color: '#666666', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333333', marginHorizontal: 16, marginTop: 8, marginBottom: 8 },
  actionsRow: { flexDirection: 'row', marginHorizontal: 16, gap: 12 },
  actionCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12,
    padding: 20, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  actionEmoji: { fontSize: 28, marginBottom: 8 },
  actionLabel: { fontSize: 13, fontWeight: '600', color: '#333333' },
  signOutButton: { margin: 16, marginTop: 24, padding: 14, alignItems: 'center' },
  signOutText: { fontSize: 14, color: '#999999' },
});
