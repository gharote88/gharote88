import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../supabase';

interface City {
  id: string;
  name: string;
  marathiName: string;
  distanceToPune: number;
  estimatedDuration: number;
  culturalHighlights: string[];
  checkpoints?: Array<{ name: string; marathiName: string; requiredXp: number }>;
}

const ROUTE_PREVIEW_WIDTH = 300;
const ROUTE_PREVIEW_HEIGHT = 160;

const RouteConfirmationScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ selectedCityJson?: string }>();
  const selectedCity: City | null = params.selectedCityJson
    ? JSON.parse(params.selectedCityJson)
    : null;

  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleConfirm = async () => {
    if (!selectedCity) return;
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/journey/start`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ routeId: selectedCity.id }),
        }
      );
      if (!res.ok) throw new Error('Failed to start journey');
      router.push({
        pathname: '/onboarding/avatar-selection',
        params: { selectedCityJson: params.selectedCityJson },
      });
    } catch (err) {
      Alert.alert('Error', 'Could not start your journey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedCity) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No city selected.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Build evenly-spaced checkpoint dots for the route preview
  const checkpoints = selectedCity.checkpoints ?? [];
  const totalNodes = checkpoints.length + 2; // start city + checkpoints + Pune
  const nodeXStep = ROUTE_PREVIEW_WIDTH / (totalNodes - 1 || 1);
  const midY = ROUTE_PREVIEW_HEIGHT / 2;

  const nodes = [
    { label: selectedCity.name, marathi: selectedCity.marathiName, x: 0, isPune: false },
    ...checkpoints.map((cp, i) => ({
      label: cp.name,
      marathi: cp.marathiName,
      x: nodeXStep * (i + 1),
      isPune: false,
    })),
    { label: 'Pune', marathi: 'पुणे', x: ROUTE_PREVIEW_WIDTH, isPune: true },
  ];

  return (
    <Animated.View
      style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Route</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Narrative intro */}
        <View style={styles.narrativeCard}>
          <Text style={styles.narrativeEmoji}>🗺️</Text>
          <Text style={styles.narrativeTitle}>
            Your journey begins in {selectedCity.name}!
          </Text>
          <Text style={styles.narrativeMarathi}>{selectedCity.marathiName} पासून पुण्यापर्यंत</Text>
          <Text style={styles.narrativeBody}>
            You'll travel across Maharashtra, learning Marathi at each checkpoint along the way.
            Complete lessons to earn XP and unlock the next stop on your adventure.
          </Text>
        </View>

        {/* Route preview SVG */}
        <View style={styles.routePreviewContainer}>
          <Text style={styles.sectionLabel}>Route Preview</Text>
          <View style={styles.svgWrapper}>
            <Svg width={ROUTE_PREVIEW_WIDTH} height={ROUTE_PREVIEW_HEIGHT}>
              {/* Dashed route line */}
              <Line
                x1={0}
                y1={midY}
                x2={ROUTE_PREVIEW_WIDTH}
                y2={midY}
                stroke="#E0E0E0"
                strokeWidth={3}
                strokeDasharray="6,4"
              />
              {/* Nodes */}
              {nodes.map((node, i) => (
                <React.Fragment key={i}>
                  <Circle
                    cx={node.x}
                    cy={midY}
                    r={node.isPune || i === 0 ? 10 : 7}
                    fill={node.isPune ? '#FF6B35' : i === 0 ? '#4CAF50' : '#FFF3E0'}
                    stroke={node.isPune ? '#FF6B35' : i === 0 ? '#4CAF50' : '#FF6B35'}
                    strokeWidth={2}
                  />
                  <SvgText
                    x={node.x}
                    y={midY + 24}
                    fontSize={9}
                    fill="#333333"
                    textAnchor="middle"
                  >
                    {node.label}
                  </SvgText>
                  <SvgText
                    x={node.x}
                    y={midY + 35}
                    fontSize={8}
                    fill="#FF6B35"
                    textAnchor="middle"
                  >
                    {node.marathi}
                  </SvgText>
                </React.Fragment>
              ))}
            </Svg>
          </View>
        </View>

        {/* Journey stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>📍</Text>
            <Text style={styles.statValue}>{selectedCity.distanceToPune} km</Text>
            <Text style={styles.statLabel}>Distance to Pune</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⏱️</Text>
            <Text style={styles.statValue}>{selectedCity.estimatedDuration} days</Text>
            <Text style={styles.statLabel}>Est. Duration</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🏁</Text>
            <Text style={styles.statValue}>{checkpoints.length + 1}</Text>
            <Text style={styles.statLabel}>Checkpoints</Text>
          </View>
        </View>

        {/* Checkpoint list */}
        {checkpoints.length > 0 && (
          <View style={styles.checkpointList}>
            <Text style={styles.sectionLabel}>Checkpoints</Text>
            {checkpoints.map((cp, i) => (
              <View key={i} style={styles.checkpointRow}>
                <View style={styles.checkpointDot} />
                <View style={styles.checkpointInfo}>
                  <Text style={styles.checkpointName}>{cp.name}</Text>
                  <Text style={styles.checkpointMarathi}>{cp.marathiName}</Text>
                </View>
                <Text style={styles.checkpointXp}>{cp.requiredXp} XP</Text>
              </View>
            ))}
            <View style={styles.checkpointRow}>
              <View style={[styles.checkpointDot, styles.checkpointDotPune]} />
              <View style={styles.checkpointInfo}>
                <Text style={styles.checkpointName}>Pune</Text>
                <Text style={styles.checkpointMarathi}>पुणे</Text>
              </View>
              <Text style={styles.checkpointXpFinal}>🏆 Goal</Text>
            </View>
          </View>
        )}

        {/* Cultural highlights */}
        {selectedCity.culturalHighlights?.length > 0 && (
          <View style={styles.highlightsCard}>
            <Text style={styles.sectionLabel}>Cultural Highlights</Text>
            {selectedCity.culturalHighlights.map((h, i) => (
              <Text key={i} style={styles.highlightItem}>• {h}</Text>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Confirm CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, loading && styles.disabledButton]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>
              Start from {selectedCity.name}! 🚀
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
    borderRadius: 20, backgroundColor: '#F5F5F5',
  },
  backButtonText: { fontSize: 24, color: '#333333', fontWeight: 'bold' },
  headerTitle: {
    fontSize: 20, fontWeight: 'bold', color: '#333333',
    flex: 1, textAlign: 'center', fontFamily: 'Poppins-Bold',
  },
  placeholder: { width: 40 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  narrativeCard: {
    backgroundColor: '#FF6B35', borderRadius: 16, padding: 20,
    alignItems: 'center', marginBottom: 16,
  },
  narrativeEmoji: { fontSize: 40, marginBottom: 8 },
  narrativeTitle: {
    fontSize: 20, fontWeight: 'bold', color: '#FFFFFF',
    textAlign: 'center', marginBottom: 4, fontFamily: 'Poppins-Bold',
  },
  narrativeMarathi: {
    fontSize: 16, color: 'rgba(255,255,255,0.9)',
    textAlign: 'center', marginBottom: 12, fontFamily: 'NotoSansDevanagari-Regular',
  },
  narrativeBody: {
    fontSize: 14, color: 'rgba(255,255,255,0.9)',
    textAlign: 'center', lineHeight: 20, fontFamily: 'OpenSans-Regular',
  },
  routePreviewContainer: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  sectionLabel: {
    fontSize: 16, fontWeight: 'bold', color: '#333333',
    marginBottom: 12, fontFamily: 'Poppins-Bold',
  },
  svgWrapper: { alignItems: 'center', paddingBottom: 8 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  statEmoji: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#FF6B35', fontFamily: 'Poppins-Bold' },
  statLabel: { fontSize: 11, color: '#666666', textAlign: 'center', fontFamily: 'OpenSans-Regular' },
  checkpointList: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  checkpointRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  checkpointDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#FFF3E0', borderWidth: 2, borderColor: '#FF6B35',
    marginRight: 12,
  },
  checkpointDotPune: { backgroundColor: '#FF6B35' },
  checkpointInfo: { flex: 1 },
  checkpointName: { fontSize: 14, fontWeight: '600', color: '#333333', fontFamily: 'Poppins-SemiBold' },
  checkpointMarathi: { fontSize: 12, color: '#FF6B35', fontFamily: 'NotoSansDevanagari-Regular' },
  checkpointXp: { fontSize: 12, color: '#666666', fontFamily: 'OpenSans-Regular' },
  checkpointXpFinal: { fontSize: 12, color: '#FF6B35', fontWeight: 'bold', fontFamily: 'Poppins-Bold' },
  highlightsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  highlightItem: { fontSize: 14, color: '#333333', lineHeight: 22, fontFamily: 'OpenSans-Regular' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF', padding: 20,
    borderTopWidth: 1, borderTopColor: '#E0E0E0',
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 5,
  },
  confirmButton: {
    backgroundColor: '#FF6B35', paddingVertical: 16, borderRadius: 30,
    alignItems: 'center', shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25,
    shadowRadius: 4, elevation: 5,
  },
  disabledButton: { backgroundColor: '#CCCCCC', shadowColor: 'transparent', elevation: 0 },
  confirmButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', fontFamily: 'Poppins-Bold' },
  errorText: { fontSize: 16, color: '#FF5252', marginBottom: 16 },
  backBtn: { backgroundColor: '#FF6B35', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  backBtnText: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' },
});

export default RouteConfirmationScreen;
