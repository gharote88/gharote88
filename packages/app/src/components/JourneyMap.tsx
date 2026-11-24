import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Animated,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Svg, Path, Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import LottieView from 'lottie-react-native';
import { supabase } from '../supabase';

const { width, height } = Dimensions.get('window');

const MAP_WIDTH = width - 32;
const MAP_HEIGHT = height * 0.52;
const PADDING = 40;

interface Checkpoint {
  id: string;
  name: string;
  marathiName: string;
  position: { x: number; y: number };
  requiredXp: number;
  unlocks: string[];
  triviaId?: string;
}

interface JourneyRoute {
  id: string;
  startCity: string;
  targetCity: string;
  totalDistance: number;
  checkpoints: Checkpoint[];
}

interface JourneyProgress {
  currentCheckpointIndex: number;
  currentPosition: { x: number; y: number };
  totalXpEarned: number;
  progressPercentage: number;
  completedCheckpoints: string[];
}

interface CheckpointDetail {
  checkpoint: { id: string; name: string; nameMarathi: string; requiredXp: number; status: string };
  unlockedLessons: { id: string; title: string; title_marathi: string; level: string; xp_reward: number }[];
  trivia: { content_english: string; content_marathi: string; category: string } | null;
}

interface JourneyMapProps {
  onCheckpointPress?: (checkpointId: string) => void;
  onJourneyComplete?: () => void;
}

function scaleCoordinates(checkpoints: Checkpoint[]) {
  const xs = checkpoints.map(cp => cp.position.x);
  const ys = checkpoints.map(cp => cp.position.y);
  const maxX = Math.max(...xs) || 1;
  const maxY = Math.max(...ys) || 1;
  const sx = (MAP_WIDTH - PADDING * 2) / maxX;
  const sy = (MAP_HEIGHT - PADDING * 2) / maxY;
  const s = Math.min(sx, sy);
  return checkpoints.map(cp => ({
    ...cp,
    sx: cp.position.x * s + PADDING,
    sy: cp.position.y * s + PADDING,
  }));
}

const JourneyMap: React.FC<JourneyMapProps> = ({ onCheckpointPress, onJourneyComplete }) => {
  const [route, setRoute] = useState<JourneyRoute | null>(null);
  const [progress, setProgress] = useState<JourneyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedCpId, setSelectedCpId] = useState<string | null>(null);
  const [cpDetail, setCpDetail] = useState<CheckpointDetail | null>(null);
  const [cpDetailLoading, setCpDetailLoading] = useState(false);

  const avatarX = useRef(new Animated.Value(PADDING)).current;
  const avatarY = useRef(new Animated.Value(PADDING)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse loop for current checkpoint
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const animateAvatar = useCallback((pos: { x: number; y: number }, scaled: ReturnType<typeof scaleCoordinates>) => {
    const xs = scaled.map(cp => cp.position.x);
    const ys = scaled.map(cp => cp.position.y);
    const maxX = Math.max(...xs) || 1;
    const maxY = Math.max(...ys) || 1;
    const sx = (MAP_WIDTH - PADDING * 2) / maxX;
    const sy = (MAP_HEIGHT - PADDING * 2) / maxY;
    const s = Math.min(sx, sy);
    Animated.timing(avatarX, { toValue: pos.x * s + PADDING, duration: 600, useNativeDriver: false }).start();
    Animated.timing(avatarY, { toValue: pos.y * s + PADDING, duration: 600, useNativeDriver: false }).start();
  }, [avatarX, avatarY]);

  const applyProgress = useCallback((p: JourneyProgress, r: JourneyRoute) => {
    const scaled = scaleCoordinates(r.checkpoints);
    animateAvatar(p.currentPosition, scaled);
    Animated.timing(progressAnim, { toValue: p.progressPercentage, duration: 800, useNativeDriver: false }).start();
    if (p.progressPercentage >= 100) {
      setShowCelebration(true);
      onJourneyComplete?.();
    }
  }, [animateAvatar, progressAnim, onJourneyComplete]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/journey/get`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        const result = await res.json();
        if (result.hasJourney) {
          setRoute(result.route);
          setProgress(result.journey);
          applyProgress(result.journey, result.route);
        }
      } catch (e) {
        console.error('JourneyMap load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Realtime subscription on journey_progress
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const subscribe = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel(`journey_map:${user.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'journey_progress', filter: `user_id=eq.${user.id}` },
          (payload) => {
            const d = payload.new;
            const updated: JourneyProgress = {
              currentCheckpointIndex: d.current_checkpoint_index,
              currentPosition: d.current_position,
              totalXpEarned: d.total_xp_earned,
              progressPercentage: d.progress_percentage,
              completedCheckpoints: d.completed_checkpoints ?? [],
            };
            setProgress(updated);
            if (route) applyProgress(updated, route);
          }
        )
        .subscribe();
    };

    subscribe();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [route, applyProgress]);

  const handleCheckpointPress = useCallback(async (cpId: string) => {
    setSelectedCpId(cpId);
    setCpDetail(null);
    setCpDetailLoading(true);
    onCheckpointPress?.(cpId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/journey/checkpoints/${cpId}`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      const data = await res.json();
      setCpDetail(data);
    } catch (e) {
      console.error('Checkpoint detail error:', e);
    } finally {
      setCpDetailLoading(false);
    }
  }, [onCheckpointPress]);

  const getStatus = useCallback((cpId: string): 'completed' | 'current' | 'locked' => {
    if (!progress) return 'locked';
    if (progress.completedCheckpoints.includes(cpId)) return 'completed';
    const idx = route?.checkpoints.findIndex(c => c.id === cpId) ?? -1;
    if (idx === progress.currentCheckpointIndex) return 'current';
    return 'locked';
  }, [progress, route]);

  const statusColor = (s: string) =>
    s === 'completed' ? '#4CAF50' : s === 'current' ? '#FFC107' : '#9E9E9E';

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading your journey...</Text>
      </View>
    );
  }

  if (!route || !progress) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No journey started yet</Text>
        <Text style={styles.emptySubtitle}>Complete onboarding to begin your adventure!</Text>
      </View>
    );
  }

  const scaled = scaleCoordinates(route.checkpoints);
  const pathD = scaled.map((cp, i) => `${i === 0 ? 'M' : 'L'} ${cp.sx} ${cp.sy}`).join(' ');
  const completedCount = progress.completedCheckpoints.length;
  const completedPathD = completedCount > 0
    ? scaled.slice(0, completedCount + 1).map((cp, i) => `${i === 0 ? 'M' : 'L'} ${cp.sx} ${cp.sy}`).join(' ')
    : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{route.startCity} → {route.targetCity}</Text>
        <Text style={styles.headerSub}>{route.totalDistance} km</Text>
      </View>

      {/* Map */}
      <View style={styles.mapWrapper}>
        <Svg width={MAP_WIDTH} height={MAP_HEIGHT}>
          <Defs>
            <LinearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#FF6B35" stopOpacity="1" />
              <Stop offset="100%" stopColor="#004E89" stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Full route (grey) */}
          <Path d={pathD} stroke="#E0E0E0" strokeWidth={4} fill="none" strokeLinecap="round" />

          {/* Completed segment (green) */}
          {completedPathD && (
            <Path d={completedPathD} stroke="#4CAF50" strokeWidth={4} fill="none" strokeLinecap="round" />
          )}

          {/* Checkpoints */}
          {scaled.map((cp) => {
            const status = getStatus(cp.id);
            const color = statusColor(status);
            const isCurrent = status === 'current';
            return (
              <React.Fragment key={cp.id}>
                {/* Pulse ring for current */}
                {isCurrent && (
                  <Circle cx={cp.sx} cy={cp.sy} r={20} fill="none" stroke="#FFC107" strokeWidth={2} opacity={0.4} />
                )}
                {/* Marker — tappable */}
                <Circle
                  cx={cp.sx} cy={cp.sy}
                  r={isCurrent ? 13 : 9}
                  fill={color} stroke="#FFFFFF" strokeWidth={2}
                  onPress={() => handleCheckpointPress(cp.id)}
                />
                {/* Completed checkmark */}
                {status === 'completed' && (
                  <SvgText x={cp.sx} y={cp.sy + 5} fontSize={10} fill="#FFFFFF" textAnchor="middle">✓</SvgText>
                )}
                {/* City name */}
                <SvgText x={cp.sx} y={cp.sy - 18} fontSize={11} fill="#333" textAnchor="middle" fontWeight="bold">
                  {cp.name}
                </SvgText>
                <SvgText x={cp.sx} y={cp.sy - 6} fontSize={9} fill="#666" textAnchor="middle">
                  {cp.marathiName}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>

        {/* Avatar — absolutely positioned over SVG */}
        <Animated.View
          style={[
            styles.avatar,
            { left: Animated.subtract(avatarX, 14), top: Animated.subtract(avatarY, 14) },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.avatarEmoji}>🧑</Text>
        </Animated.View>

        {/* Celebration overlay */}
        {showCelebration && (
          <View style={styles.celebrationOverlay}>
            <LottieView
              source={require('../assets/animations/celebration.json')}
              autoPlay loop={false}
              style={styles.celebrationAnim}
              onAnimationFinish={() => setShowCelebration(false)}
            />
          </View>
        )}
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Journey Progress</Text>
          <Text style={styles.progressPct}>{Math.round(progress.progressPercentage)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100], outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statText}>⭐ {progress.totalXpEarned} XP</Text>
          <Text style={styles.statText}>
            📍 {progress.completedCheckpoints.length}/{route.checkpoints.length} checkpoints
          </Text>
        </View>
      </View>

      {/* Checkpoint detail modal */}
      <Modal
        visible={!!selectedCpId}
        transparent animationType="slide"
        onRequestClose={() => setSelectedCpId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, { backgroundColor: selectedCpId ? statusColor(getStatus(selectedCpId)) : '#FF6B35' }]}>
              <Text style={styles.modalTitle}>
                {cpDetail?.checkpoint.name ?? route.checkpoints.find(c => c.id === selectedCpId)?.name ?? ''}
              </Text>
              <Text style={styles.modalMarathi}>
                {cpDetail?.checkpoint.nameMarathi ?? route.checkpoints.find(c => c.id === selectedCpId)?.marathiName ?? ''}
              </Text>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>
                  {selectedCpId ? getStatus(selectedCpId).toUpperCase() : ''}
                </Text>
              </View>
            </View>

            {cpDetailLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator color="#FF6B35" />
              </View>
            ) : (
              <ScrollView style={styles.modalBody}>
                {cpDetail && (
                  <>
                    <Text style={styles.sectionTitle}>Required XP</Text>
                    <Text style={styles.sectionValue}>{cpDetail.checkpoint.requiredXp} XP</Text>

                    {cpDetail.unlockedLessons.length > 0 && (
                      <>
                        <Text style={styles.sectionTitle}>📚 Unlocked Lessons</Text>
                        {cpDetail.unlockedLessons.map((l) => (
                          <View key={l.id} style={styles.lessonRow}>
                            <Text style={styles.lessonTitle}>{l.title}</Text>
                            <Text style={styles.lessonMarathi}>{l.title_marathi}</Text>
                            <Text style={styles.lessonMeta}>{l.level} · {l.xp_reward} XP</Text>
                          </View>
                        ))}
                      </>
                    )}

                    {cpDetail.trivia && (
                      <>
                        <Text style={styles.sectionTitle}>🌟 Cultural Trivia</Text>
                        <Text style={styles.triviaMarathi}>{cpDetail.trivia.content_marathi}</Text>
                        <Text style={styles.triviaEnglish}>{cpDetail.trivia.content_english}</Text>
                      </>
                    )}
                  </>
                )}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedCpId(null)}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#666', fontFamily: 'OpenSans-Regular' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', fontFamily: 'Poppins-Bold' },
  emptySubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8, fontFamily: 'OpenSans-Regular' },
  header: { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', fontFamily: 'Poppins-Bold' },
  headerSub: { fontSize: 13, color: '#666', marginTop: 2, fontFamily: 'OpenSans-Regular' },
  mapWrapper: { margin: 16, borderRadius: 12, overflow: 'hidden', backgroundColor: '#FFF', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  avatar: { position: 'absolute', width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  avatarEmoji: { fontSize: 22 },
  celebrationOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  celebrationAnim: { width: 280, height: 280 },
  progressContainer: { marginHorizontal: 16, backgroundColor: '#FFF', borderRadius: 12, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', fontFamily: 'Poppins-Bold' },
  progressPct: { fontSize: 14, fontWeight: 'bold', color: '#FF6B35', fontFamily: 'Poppins-Bold' },
  progressBar: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', backgroundColor: '#FF6B35', borderRadius: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statText: { fontSize: 13, color: '#666', fontFamily: 'OpenSans-Regular' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: height * 0.75, overflow: 'hidden' },
  modalHeader: { padding: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF', fontFamily: 'Poppins-Bold' },
  modalMarathi: { fontSize: 16, color: '#FFF', marginTop: 4, fontFamily: 'NotoSansDevanagari-Regular' },
  statusPill: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  statusPillText: { fontSize: 11, fontWeight: 'bold', color: '#FFF', fontFamily: 'Poppins-Bold' },
  modalLoading: { padding: 40, alignItems: 'center' },
  modalBody: { padding: 20 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 6, fontFamily: 'Poppins-Bold' },
  sectionValue: { fontSize: 16, color: '#333', fontFamily: 'OpenSans-Regular' },
  lessonRow: { backgroundColor: '#F9F9F9', borderRadius: 8, padding: 12, marginBottom: 8 },
  lessonTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', fontFamily: 'Poppins-Bold' },
  lessonMarathi: { fontSize: 13, color: '#FF6B35', marginTop: 2, fontFamily: 'NotoSansDevanagari-Regular' },
  lessonMeta: { fontSize: 12, color: '#999', marginTop: 4, fontFamily: 'OpenSans-Regular' },
  triviaMarathi: { fontSize: 15, color: '#333', fontFamily: 'NotoSansDevanagari-Regular', lineHeight: 22, marginBottom: 6 },
  triviaEnglish: { fontSize: 14, color: '#666', fontFamily: 'OpenSans-Regular', lineHeight: 20, fontStyle: 'italic' },
  closeBtn: { padding: 16, backgroundColor: '#FF6B35', alignItems: 'center' },
  closeBtnText: { fontSize: 16, fontWeight: 'bold', color: '#FFF', fontFamily: 'Poppins-Bold' },
});

export default JourneyMap;
