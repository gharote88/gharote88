import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Share,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../supabase';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

interface CompletionData {
  journeyId: string;
  completedAt: string;
  totalXpEarned: number;
  timeTaken: number;
  lessonsCompleted: number;
  checkpointsReached: number;
  badgesEarned: string[];
  certificateUrl?: string;
}

interface RouteParams {
  completionData: CompletionData;
}

const JourneyCompletionScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ completionDataJson?: string }>();
  const completionData: CompletionData | null = params.completionDataJson ? JSON.parse(params.completionDataJson) : null;
  
  const [loading, setLoading] = useState(false);
  const [certificateGenerated, setCertificateGenerated] = useState(false);
  const [shareableImage, setShareableImage] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    animateEntrance();
  }, []);

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleShareAchievement = async () => {
    try {
      const shareMessage = `
🎉 I just completed my Marathi learning journey!
📍 From ${completionData?.journeyId?.replace('route_', '').replace('_to_pune', '')} to Pune
⭐ ${completionData?.totalXpEarned} XP earned
📚 ${completionData?.lessonsCompleted} lessons completed
🏅 ${completionData?.badgesEarned?.length} badges earned

Start your own journey with the Marathi Learning App!
      `.trim();

      await Share.share({
        message: shareMessage,
        title: 'Marathi Learning Journey Complete!',
      });
    } catch (error) {
      console.error('Error sharing achievement:', error);
      Alert.alert('Error', 'Failed to share achievement');
    }
  };

  const handleGenerateCertificate = async () => {
    if (!completionData || certificateGenerated) return;
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/journey/certificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ journeyId: completionData.journeyId }),
      });
      const data = await res.json();
      if (data.success) {
        setCertificateGenerated(true);
        setShareableImage(data.certificateUrl || null);
        Alert.alert('Success', 'Certificate generated successfully!');
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      Alert.alert('Error', 'Failed to generate certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewJourney = () => {
    router.replace('/onboarding/city-selection');
  };

  const handleViewBadges = () => {
    router.push('/dashboard');
  };

  const formatTimeTaken = (days: number): string => {
    if (days < 1) return 'Less than a day';
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.round(days / 7)} weeks`;
    return `${Math.round(days / 30)} months`;
  };

  if (!completionData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No completion data available</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Celebration Animation */}
      <View style={styles.celebrationContainer}>
        <LottieView
          source={require('../assets/animations/journey-complete.json')}
          autoPlay
          loop={false}
          style={styles.celebrationAnimation}
        />
      </View>

      {/* Main Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🎊 Journey Complete!</Text>
          <Text style={styles.headerSubtitle}>
            Welcome to Pune! (पुणे)
          </Text>
        </View>

        {/* User Avatar and Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>🏆</Text>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{completionData.totalXpEarned}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{completionData.lessonsCompleted}</Text>
              <Text style={styles.statLabel}>Lessons</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{completionData.checkpointsReached}</Text>
              <Text style={styles.statLabel}>Checkpoints</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{completionData.badgesEarned.length}</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
          </View>
        </View>

        {/* Journey Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Journey Statistics</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time Taken:</Text>
            <Text style={styles.detailValue}>
              {formatTimeTaken(completionData.timeTaken)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Average XP per Day:</Text>
            <Text style={styles.detailValue}>
              {Math.round(completionData.totalXpEarned / Math.max(completionData.timeTaken, 1))}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Completion Date:</Text>
            <Text style={styles.detailValue}>
              {completionData.completedAt
              ? new Date(completionData.completedAt).toLocaleDateString()
              : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Badges Earned */}
        <View style={styles.badgesContainer}>
          <Text style={styles.badgesTitle}>🏅 Badges Earned</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {completionData.badgesEarned.map((badgeId, index) => (
              <View key={index} style={styles.badgeItem}>
                <Text style={styles.badgeEmoji}>🎖️</Text>
                <Text style={styles.badgeName}>
                  {badgeId.replace('badge_', '').replace(/_/g, ' ').toUpperCase()}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Certificate Section */}
        <View style={styles.certificateContainer}>
          <Text style={styles.certificateTitle}>📜 Certificate of Achievement</Text>
          <Text style={styles.certificateDescription}>
            Generate your personalized certificate to share your achievement!
          </Text>
          
          {shareableImage ? (
            <Image
              source={{ uri: shareableImage }}
              style={styles.certificateImage}
              resizeMode="contain"
            />
          ) : (
            <TouchableOpacity
              style={[
                styles.generateButton,
                loading && styles.disabledButton,
              ]}
              onPress={handleGenerateCertificate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.generateButtonText}>Generate Certificate</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShareAchievement}
          >
            <Text style={styles.actionButtonText}>📤 Share Achievement</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewBadges}
          >
            <Text style={styles.actionButtonText}>🏅 View All Badges</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleStartNewJourney}
          >
            <Text style={styles.primaryButtonText}>🚀 Start New Journey</Text>
          </TouchableOpacity>
        </View>

        {/* Pune Welcome Message */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>स्वागत आहे पुण्यात!</Text>
          <Text style={styles.welcomeSubtitle}>
            Welcome to Pune, the cultural capital of Maharashtra!
          </Text>
          <Text style={styles.welcomeText}>
            You've successfully completed your Marathi learning journey. 
            Continue practicing to maintain your skills and explore advanced content!
          </Text>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  celebrationContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationAnimation: {
    width: 300,
    height: 300,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B35',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#004E89',
    textAlign: 'center',
    fontFamily: 'NotoSansDevanagari-Regular',
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  avatarEmoji: {
    fontSize: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 4,
    fontFamily: 'Poppins-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'OpenSans-Regular',
  },
  detailsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    fontFamily: 'Poppins-Bold',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'OpenSans-Regular',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Poppins-SemiBold',
  },
  badgesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    fontFamily: 'Poppins-Bold',
  },
  badgeItem: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 80,
  },
  badgeEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  certificateContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  certificateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
  },
  certificateDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    fontFamily: 'OpenSans-Regular',
  },
  certificateImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  generateButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    shadowColor: 'transparent',
    elevation: 0,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Poppins-SemiBold',
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    borderWidth: 0,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
  welcomeContainer: {
    backgroundColor: '#004E89',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'NotoSansDevanagari-Bold',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'OpenSans-Regular',
  },
  welcomeText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.9,
    fontFamily: 'OpenSans-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF5252',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'OpenSans-Regular',
  },
  backButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
});

export default JourneyCompletionScreen;