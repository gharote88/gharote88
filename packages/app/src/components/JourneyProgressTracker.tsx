import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { supabase } from '../supabase';
import { useJourneyProgression, useAutoJourneyUpdate } from '../hooks/useJourneyProgression';

const { width, height } = Dimensions.get('window');

export interface JourneyProgressTrackerHandle {
  updateProgress: (xpEarned: number, lessonId?: string) => Promise<any>;
}

interface JourneyProgressTrackerProps {
  onCheckpointUnlock?: (checkpointId: string) => void;
  onJourneyComplete?: () => void;
  onBadgeEarned?: (badgeId: string) => void;
}

const JourneyProgressTracker = forwardRef<JourneyProgressTrackerHandle, JourneyProgressTrackerProps>((
  { onCheckpointUnlock, onJourneyComplete, onBadgeEarned },
  ref
) => {
  const {
    journeyProgress,
    loading,
    error,
    updateProgress,
    getJourneyStats,
  } = useJourneyProgression();

  useAutoJourneyUpdate();

  useImperativeHandle(ref, () => ({ updateProgress: handleUpdateProgress }));

  // UI State
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'checkpoint' | 'badge' | 'journey' | null>(null);
  const [notificationData, setNotificationData] = useState<{
    checkpointId?: string;
    checkpointName?: string;
    lessons?: string[];
    badgeId?: string;
    badgeName?: string;
    xpReward?: number;
    totalXp?: number;
  } | null>(null);

  // Animation values
  const notificationAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (journeyProgress) {
      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: journeyProgress.progressPercentage,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [journeyProgress]);

  const showNotificationModal = (type: 'checkpoint' | 'badge' | 'journey', data: {
    checkpointId?: string;
    checkpointName?: string;
    lessons?: string[];
    badgeId?: string;
    badgeName?: string;
    xpReward?: number;
    totalXp?: number;
  }) => {
    setNotificationType(type);
    setNotificationData(data);
    setShowNotification(true);

    // Animate notification in
    Animated.timing(notificationAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto-hide after 5 seconds
    setTimeout(() => {
      hideNotificationModal();
    }, 5000);
  };

  const hideNotificationModal = () => {
    Animated.timing(notificationAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowNotification(false);
      setNotificationType(null);
      setNotificationData(null);
    });
  };

  const handleNotificationAction = () => {
    if (notificationType === 'checkpoint' && notificationData?.checkpointId) {
      onCheckpointUnlock?.(notificationData.checkpointId);
    } else if (notificationType === 'badge' && notificationData?.badgeId) {
      onBadgeEarned?.(notificationData.badgeId);
    } else if (notificationType === 'journey') {
      onJourneyComplete?.();
    }
    hideNotificationModal();
  };

  const PUNE_EXPLORER_BADGE_ID = 'b0000001-0000-0000-0000-000000000006';

  const awardPuneExplorerBadge = useCallback(async (totalXp: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/gamification/xp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          source: 'badge',
          xpAmount: 500,
          referenceId: `badge_${PUNE_EXPLORER_BADGE_ID}`,
        }),
      });
    } catch (e) {
      console.error('Failed to award Pune Explorer badge:', e);
    }
  }, []);

  const handleUpdateProgress = useCallback(async (xpEarned: number, lessonId?: string) => {
    const result = await updateProgress(xpEarned, lessonId);

    if (result.journeyCompleted) {
      await awardPuneExplorerBadge(result.progressPercentage);
      showNotificationModal('journey', { totalXp: journeyProgress?.totalXpEarned });
      onJourneyComplete?.();
    } else if (result.newUnlocks.length > 0) {
      result.newUnlocks.forEach((unlock) => {
        showNotificationModal('checkpoint', {
          checkpointId: unlock.checkpointId,
          lessons: unlock.lessons,
        });
        onCheckpointUnlock?.(unlock.checkpointId);
      });
    }

    return result;
  }, [updateProgress, journeyProgress, awardPuneExplorerBadge, onJourneyComplete, onCheckpointUnlock]);
    switch (notificationType) {
      case 'checkpoint':
        return (
          <>
            <LottieView
              source={require('../assets/animations/checkpoint-unlock.json')}
              autoPlay
              loop={false}
              style={styles.notificationAnimation}
            />
            <Text style={styles.notificationTitle}>🎉 Checkpoint Unlocked!</Text>
            <Text style={styles.notificationText}>
              {notificationData?.checkpointName || 'New checkpoint reached'}
            </Text>
            <Text style={styles.notificationSubtext}>
              {notificationData?.lessons?.length || 0} new lessons unlocked
            </Text>
          </>
        );

      case 'badge':
        return (
          <>
            <LottieView
              source={require('../assets/animations/badge-earned.json')}
              autoPlay
              loop={false}
              style={styles.notificationAnimation}
            />
            <Text style={styles.notificationTitle}>🏅 Badge Earned!</Text>
            <Text style={styles.notificationText}>
              {notificationData?.badgeName || 'New achievement'}
            </Text>
            <Text style={styles.notificationSubtext}>
              +{notificationData?.xpReward || 0} XP
            </Text>
          </>
        );

      case 'journey':
        return (
          <>
            <LottieView
              source={require('../assets/animations/journey-complete.json')}
              autoPlay
              loop={false}
              style={styles.notificationAnimation}
            />
            <Text style={styles.notificationTitle}>🎊 Journey Complete!</Text>
            <Text style={styles.notificationText}>
              Congratulations! You've reached Pune!
            </Text>
            <Text style={styles.notificationSubtext}>
              {notificationData?.totalXp || 0} XP earned
            </Text>
          </>
        );

      default:
        return null;
    }
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading journey progress...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const stats = getJourneyStats();

  return (
    <>
      {/* Progress Bar Component */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Journey Progress</Text>
          <Text style={styles.progressPercentage}>
            {Math.round(stats?.progress || 0)}%
          </Text>
        </View>
        
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        <View style={styles.progressStats}>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statText}>{stats?.totalXp || 0} XP</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>📍</Text>
            <Text style={styles.statText}>
              Checkpoint {stats?.currentCheckpoint || 0}
            </Text>
          </View>
        </View>
      </View>

      {/* Notification Modal */}
      <Modal
        visible={showNotification}
        transparent
        animationType="fade"
        onRequestClose={hideNotificationModal}
      >
        <Animated.View
          style={[
            styles.notificationOverlay,
            {
              opacity: notificationAnim,
            },
          ]}
        >
          <View style={styles.notificationContent}>
            {renderNotificationContent()}

            <TouchableOpacity
              style={styles.notificationButton}
              onPress={handleNotificationAction}
            >
              <Text style={styles.notificationButtonText}>
                {notificationType === 'journey' ? 'View Certificate' : 'Continue'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={hideNotificationModal}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
    </>
  );

const styles = StyleSheet.create({
  progressContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    fontFamily: 'Poppins-Bold',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
    fontFamily: 'Poppins-Bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'OpenSans-Regular',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    margin: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#FF5252',
    fontFamily: 'OpenSans-Regular',
  },
  notificationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notificationContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  notificationAnimation: {
    width: 150,
    height: 150,
    marginBottom: 16,
  },
  notificationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
  },
  notificationText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'OpenSans-Regular',
  },
  notificationSubtext: {
    fontSize: 14,
    color: '#FF6B35',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'OpenSans-Regular',
  },
  notificationButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  notificationButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'OpenSans-Regular',
  },
});

JourneyProgressTracker.displayName = 'JourneyProgressTracker';

export default JourneyProgressTracker;