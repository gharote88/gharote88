import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@marathi-learning/shared';

const PREF_KEYS = [
  { key: 'streakReminder', label: 'Streak Reminder', desc: 'Daily reminder to keep your streak alive', icon: '🔥' },
  { key: 'dailyChallenge', label: 'Daily Challenge', desc: 'Alert when a new challenge is available', icon: '⚡' },
  { key: 'factOfTheDay', label: 'Fact of the Day', desc: 'Morning cultural fun fact', icon: '💡' },
  { key: 'weeklyReport', label: 'Weekly Report', desc: 'Summary of your weekly progress', icon: '📊' },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      const data = await api('/api/notifications?action=preferences');
      setPrefs(data.preferences ?? {});
    } finally {
      setLoading(false);
    }
  }

  async function toggle(key: string, value: boolean) {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setSaving(true);
    try {
      await api('/api/notifications?action=preferences', { method: 'PUT', body: JSON.stringify(updated) });
    } catch {
      setPrefs(prefs); // revert
      Alert.alert('Error', 'Failed to save preference.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <SafeAreaView style={s.container}><View style={s.center}><ActivityIndicator size="large" color="#FF6B35" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
        <Text style={s.headerTitle}>Notifications</Text>
        {saving ? <ActivityIndicator size="small" color="#FF6B35" /> : <View style={{ width: 24 }} />}
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.sectionLabel}>Notification Preferences</Text>
        <View style={s.card}>
          {PREF_KEYS.map((item, i) => (
            <View key={item.key} style={[s.row, i < PREF_KEYS.length - 1 && s.rowBorder]}>
              <Text style={s.rowIcon}>{item.icon}</Text>
              <View style={s.rowInfo}>
                <Text style={s.rowLabel}>{item.label}</Text>
                <Text style={s.rowDesc}>{item.desc}</Text>
              </View>
              <Switch
                value={prefs[item.key] ?? true}
                onValueChange={v => toggle(item.key, v)}
                trackColor={{ false: '#e5e7eb', true: '#FF6B35' }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        <Text style={s.sectionLabel}>Quiet Hours</Text>
        <View style={s.card}>
          <View style={s.row}>
            <Ionicons name="moon-outline" size={22} color="#FF6B35" />
            <View style={s.rowInfo}>
              <Text style={s.rowLabel}>Quiet Hours</Text>
              <Text style={s.rowDesc}>No notifications between 9 PM – 7 AM local time</Text>
            </View>
            <Switch
              value={prefs.quietHours ?? true}
              onValueChange={v => toggle('quietHours', v)}
              trackColor={{ false: '#e5e7eb', true: '#FF6B35' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <Text style={s.note}>Notifications are sent via push. Make sure notifications are enabled in your device settings.</Text>
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
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 10, marginTop: 8, letterSpacing: 0.5 },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowIcon: { fontSize: 22 },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  rowDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  note: { fontSize: 12, color: '#aaa', textAlign: 'center', lineHeight: 18 },
});
