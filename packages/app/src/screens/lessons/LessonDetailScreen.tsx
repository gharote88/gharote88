import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../supabase';

interface Lesson {
  id: string;
  title: string;
  titleMarathi: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  topic: string;
  orderIndex: number;
  estimatedMinutes: number;
  learningObjectives: string[];
  xpReward: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  content: {
    introduction: {
      text: string;
      marathiText: string;
      audioUrl: string;
    };
    phrases: string[];
    writingExercises: string[];
    readingPassage?: string;
    miniGame?: string;
    quizQuestions: string[];
  };
  unlocks: {
    nextLesson?: string;
    badges?: string[];
  };
  prerequisites?: string[];
  userProgress?: {
    status: 'not_started' | 'in_progress' | 'completed';
    score?: number;
    xpEarned?: number;
    timeSpent?: number;
    attempts?: number;
    skillBreakdown?: {
      speaking: { score: number; attempts: number };
      writing: { score: number; attempts: number };
      reading: { score: number; attempts: number };
    };
  };
  canStart?: boolean;
}

const LessonDetailScreen: React.FC = () => {
  const router = useRouter();
  const { id: lessonId } = useLocalSearchParams<{ id: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingLesson, setStartingLesson] = useState(false);

  useEffect(() => {
    loadLessonDetails();
  }, [lessonId]);

  const loadLessonDetails = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/lessons/${lessonId}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Failed to load lesson');
      setLesson(await res.json());
    } catch (error) {
      console.error('Error loading lesson details:', error);
      Alert.alert('Error', 'Failed to load lesson details');
    } finally {
      setLoading(false);
    }
  };

  const startLesson = async () => {
    if (!lesson || !lesson.canStart) return;
    try {
      setStartingLesson(true);
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/progress/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ lessonId, status: 'in_progress' }),
      });
      router.push({ pathname: '/practice', params: { lessonId, mode: 'speaking' } });
    } catch (error) {
      console.error('Error starting lesson:', error);
      Alert.alert('Error', 'Failed to start lesson');
    } finally {
      setStartingLesson(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return '#4CAF50';
      case 'intermediate':
        return '#FF9800';
      case 'advanced':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'hard':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}>
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={styles.statusBadgeText}>Completed</Text>
          </View>
        );
      case 'in_progress':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#FF9800' }]}>
            <Ionicons name="time" size={16} color="#fff" />
            <Text style={styles.statusBadgeText}>In Progress</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#9E9E9E' }]}>
            <Ionicons name="lock-closed" size={16} color="#fff" />
            <Text style={styles.statusBadgeText}>Not Started</Text>
          </View>
        );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading lesson details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!lesson) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
          <Text style={styles.errorText}>Lesson not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.lessonNumber}>
              <Text style={styles.lessonNumberText}>{lesson.orderIndex}</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>{lesson.title}</Text>
              <Text style={styles.headerSubtitle}>{lesson.titleMarathi}</Text>
            </View>
          </View>
          {getStatusBadge(lesson.userProgress?.status)}
        </View>

        {/* Lesson Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Duration</Text>
              <Text style={styles.infoValue}>{lesson.estimatedMinutes} min</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="star-outline" size={20} color="#FFC107" />
              <Text style={styles.infoLabel}>XP Reward</Text>
              <Text style={styles.infoValue}>{lesson.xpReward} XP</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="layers-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Level</Text>
              <View style={[styles.levelBadge, { backgroundColor: getLevelColor(lesson.level) }]}>
                <Text style={styles.levelBadgeText}>
                  {lesson.level.charAt(0).toUpperCase() + lesson.level.slice(1)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="speedometer-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Difficulty</Text>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(lesson.difficulty) }]}>
                <Text style={styles.difficultyBadgeText}>
                  {lesson.difficulty.charAt(0).toUpperCase() + lesson.difficulty.slice(1)}
                </Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="pricetag-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{lesson.category}</Text>
            </View>
          </View>
        </View>

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Introduction</Text>
          <View style={styles.introductionCard}>
            <Text style={styles.introductionText}>{lesson.content.introduction.text}</Text>
            <Text style={styles.introductionMarathi}>{lesson.content.introduction.marathiText}</Text>
          </View>
        </View>

        {/* Learning Objectives */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Objectives</Text>
          <View style={styles.objectivesContainer}>
            {lesson.learningObjectives.map((objective, index) => (
              <View key={index} style={styles.objectiveItem}>
                <View style={styles.objectiveBullet}>
                  <Ionicons name="checkmark" size={16} color="#4CAF50" />
                </View>
                <Text style={styles.objectiveText}>{objective}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Lesson Content */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lesson Content</Text>
          
          <View style={styles.contentItem}>
            <View style={styles.contentIcon}>
              <Ionicons name="book-outline" size={24} color="#4CAF50" />
            </View>
            <View style={styles.contentInfo}>
              <Text style={styles.contentTitle}>Phrases</Text>
              <Text style={styles.contentDescription}>{lesson.content.phrases.length} phrases to learn</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </View>

          <View style={styles.contentItem}>
            <View style={styles.contentIcon}>
              <Ionicons name="create-outline" size={24} color="#2196F3" />
            </View>
            <View style={styles.contentInfo}>
              <Text style={styles.contentTitle}>Writing Exercises</Text>
              <Text style={styles.contentDescription}>{lesson.content.writingExercises.length} exercises</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </View>

          {lesson.content.readingPassage && (
            <View style={styles.contentItem}>
              <View style={styles.contentIcon}>
                <Ionicons name="book-outline" size={24} color="#FF9800" />
              </View>
              <View style={styles.contentInfo}>
                <Text style={styles.contentTitle}>Reading Passage</Text>
                <Text style={styles.contentDescription}>Practice reading comprehension</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          )}

          {lesson.content.miniGame && (
            <View style={styles.contentItem}>
              <View style={styles.contentIcon}>
                <Ionicons name="game-controller-outline" size={24} color="#9C27B0" />
              </View>
              <View style={styles.contentInfo}>
                <Text style={styles.contentTitle}>Mini Game</Text>
                <Text style={styles.contentDescription}>Fun reinforcement activity</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          )}

          <View style={styles.contentItem}>
            <View style={styles.contentIcon}>
              <Ionicons name="help-circle-outline" size={24} color="#F44336" />
            </View>
            <View style={styles.contentInfo}>
              <Text style={styles.contentTitle}>Quiz</Text>
              <Text style={styles.contentDescription}>{lesson.content.quizQuestions.length} questions</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </View>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsContainer}>
            {lesson.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Prerequisites */}
        {lesson.prerequisites && lesson.prerequisites.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prerequisites</Text>
            <View style={styles.prerequisitesContainer}>
              {lesson.prerequisites.map((prereqId, index) => (
                <View key={index} style={styles.prerequisiteItem}>
                  <Ionicons name="lock-closed" size={16} color="#FF9800" />
                  <Text style={styles.prerequisiteText}>Lesson {prereqId.split('_')[1]}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Progress Info */}
        {lesson.userProgress && lesson.userProgress.status !== 'not_started' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Progress</Text>
            <View style={styles.progressCard}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Status:</Text>
                <Text style={styles.progressValue}>
                  {lesson.userProgress.status.charAt(0).toUpperCase() + lesson.userProgress.status.slice(1).replace('_', ' ')}
                </Text>
              </View>
              {lesson.userProgress.score !== undefined && (
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Score:</Text>
                  <Text style={styles.progressValue}>{lesson.userProgress.score}%</Text>
                </View>
              )}
              {lesson.userProgress.xpEarned !== undefined && (
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>XP Earned:</Text>
                  <Text style={styles.progressValue}>{lesson.userProgress.xpEarned} XP</Text>
                </View>
              )}
              {lesson.userProgress.timeSpent !== undefined && (
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Time Spent:</Text>
                  <Text style={styles.progressValue}>{Math.round(lesson.userProgress.timeSpent / 60)} min</Text>
                </View>
              )}
              {lesson.userProgress.attempts !== undefined && (
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Attempts:</Text>
                  <Text style={styles.progressValue}>{lesson.userProgress.attempts}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Start Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.startButton,
              (!lesson.canStart || startingLesson) && styles.startButtonDisabled,
            ]}
            onPress={startLesson}
            disabled={!lesson.canStart || startingLesson}
          >
            {startingLesson ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={lesson.userProgress?.status === 'completed' ? 'refresh' : 'play'}
                  size={20}
                  color="#fff"
                />
                <Text style={styles.startButtonText}>
                  {lesson.userProgress?.status === 'completed' ? 'Retry Lesson' : 'Start Lesson'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {!lesson.canStart && (
            <Text style={styles.lockedMessage}>
              Complete prerequisite lessons to unlock this lesson
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F44336',
    marginTop: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  lessonNumber: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lessonNumberText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  infoSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  difficultyBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  introductionCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  introductionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  introductionMarathi: {
    fontSize: 16,
    color: '#4CAF50',
    marginTop: 8,
    fontWeight: '500',
  },
  objectivesContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  objectiveItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  objectiveBullet: {
    marginRight: 8,
    marginTop: 2,
  },
  objectiveText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  contentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contentDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  prerequisitesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  prerequisiteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  prerequisiteText: {
    fontSize: 12,
    color: '#FF9800',
    marginLeft: 4,
    fontWeight: '500',
  },
  progressCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  startButtonDisabled: {
    backgroundColor: '#ccc',
    elevation: 0,
    shadowOpacity: 0,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  lockedMessage: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
});

export default LessonDetailScreen;