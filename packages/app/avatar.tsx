import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@marathi-learning/shared';

const CATEGORIES = ['hair', 'outfit', 'accessory', 'background'];

export default function AvatarScreen() {
  const router = useRouter();
  const [avatarData, setAvatarData] = useState<any>(null);
  const [category, setCategory] = useState('hair');
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState<string | null>(null);

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
      const data = await api('/api/profile/avatar');
      setAvatarData(data);
    } finally {
      setLoading(false);
    }
  }

  async function equip(itemId: string) {
    try {
      const equipped = [...(avatarData?.equippedItems ?? [])];
      const idx = equipped.indexOf(itemId);
      if (idx >= 0) equipped.splice(idx, 1);
      else equipped.push(itemId);
      await api('/api/profile/avatar?action=equip', { method: 'PUT', body: JSON.stringify({ equippedItems: equipped }) });
      setAvatarData((d: any) => ({ ...d, equippedItems: equipped }));
    } catch {
      Alert.alert('Error', 'Failed to update avatar.');
    }
  }

  async function unlock(item: any) {
    if (item.unlocked) { equip(item.id); return; }
    Alert.alert('Unlock Item', `Spend ${item.xpCost} XP to unlock "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unlock', onPress: async () => {
          setUnlocking(item.id);
          try {
            await api('/api/profile/avatar?action=unlock', { method: 'POST', body: JSON.stringify({ itemId: item.id }) });
            await load();
          } catch {
            Alert.alert('Error', 'Not enough XP or failed to unlock.');
          } finally {
            setUnlocking(null);
          }
        }
      },
    ]);
  }

  if (loading) return <SafeAreaView style={s.container}><View style={s.center}><ActivityIndicator size="large" color="#FF6B35" /></View></SafeAreaView>;

  const items = (avatarData?.availableItems ?? []).filter((i: any) => i.category === category);
  const equipped = avatarData?.equippedItems ?? [];

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
        <Text style={s.headerTitle}>Avatar</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Preview */}
      <View style={s.preview}>
        <View style={s.avatarCircle}>
          <Text style={s.avatarEmoji}>🧑</Text>
        </View>
        <Text style={s.xpLabel}>Available XP: {avatarData?.availableXp ?? 0}</Text>
      </View>

      {/* Category tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll} contentContainerStyle={s.catContent}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat} style={[s.catTab, category === cat && s.catTabActive]} onPress={() => setCategory(cat)}>
            <Text style={[s.catTabText, category === cat && s.catTabTextActive]}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Items grid */}
      <FlatList
        data={items}
        numColumns={3}
        keyExtractor={i => i.id}
        contentContainerStyle={s.grid}
        renderItem={({ item }) => {
          const isEquipped = equipped.includes(item.id);
          return (
            <TouchableOpacity
              style={[s.itemCard, isEquipped && s.itemEquipped, !item.unlocked && s.itemLocked]}
              onPress={() => unlock(item)}
              disabled={unlocking === item.id}
            >
              {unlocking === item.id
                ? <ActivityIndicator size="small" color="#FF6B35" />
                : <Text style={s.itemEmoji}>{item.emoji ?? '🎨'}</Text>
              }
              <Text style={s.itemName}>{item.name}</Text>
              {!item.unlocked && <Text style={s.itemCost}>{item.xpCost} XP</Text>}
              {isEquipped && <View style={s.equippedBadge}><Text style={s.equippedText}>✓</Text></View>}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={s.empty}>No items in this category.</Text>}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  preview: { backgroundColor: '#FF6B35', alignItems: 'center', paddingVertical: 24 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 3, borderColor: '#fff' },
  avatarEmoji: { fontSize: 40 },
  xpLabel: { fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  catScroll: { backgroundColor: '#fff', maxHeight: 52 },
  catContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  catTab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f0f0f0' },
  catTabActive: { backgroundColor: '#FF6B35' },
  catTabText: { fontSize: 13, fontWeight: '600', color: '#666' },
  catTabTextActive: { color: '#fff' },
  grid: { padding: 12 },
  itemCard: { flex: 1, margin: 6, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  itemEquipped: { borderColor: '#FF6B35', backgroundColor: '#fff8f5' },
  itemLocked: { opacity: 0.7 },
  itemEmoji: { fontSize: 32, marginBottom: 4 },
  itemName: { fontSize: 11, fontWeight: '600', color: '#333', textAlign: 'center' },
  itemCost: { fontSize: 10, color: '#888', marginTop: 2 },
  equippedBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: '#FF6B35', borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  equippedText: { fontSize: 10, color: '#fff', fontWeight: '800' },
  empty: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 15 },
});
