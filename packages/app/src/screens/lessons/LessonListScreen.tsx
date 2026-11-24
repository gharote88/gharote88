import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../supabase';

const { width } = Dimensions.get('window');

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
  userProgress?: {
    status: 'not_started' | 'in_progress' | 'completed';
    score?: number;
    xpEarned?: number;
  };
  canStart?: boolean;
}

const LessonListScreen: React.FC = () => {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadLessons();
  }, []);

  useEffect(() => {
    filterLessons();
  }, [lessons, searchQuery, selectedLevel, selectedCategory]);

  const loadLessons = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/lessons`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Failed to load lessons');
      const data = await res.json();
      setLessons(data.lessons ?? []);
      const uniqueCategories = Array.from(new Set((data.lessons ?? []).map((l: Lesson) => l.category))) as string[];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLessons = () => {
    let filtered = [...lessons];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (lesson) =>
          lesson.title.toLowerCase().includes(query) ||
          lesson.titleMarathi.includes(query) ||
          lesson.topic.toLowerCase().includes(query) ||
          lesson.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply level filter
    if (selectedLevel !== 'all') {
      filtered = filtered.filter((lesson) => lesson.level === selectedLevel);
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((lesson) => lesson.category === selectedCategory);
    }

    setFilteredLessons(filtered);
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

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />;
      case 'in_progress':
        return <Ionicons name="time" size={24} color="#FF9800" />;
      default:
        return <Ionicons name="lock-closed" size={24} color="#9E9E9E" />;
    }
  };

  const renderLessonCard = ({ item }: { item: Lesson }) => (
    <TouchableOpacity
      style={styles.lessonCard}
      onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: item.id } })}
      disabled={!item.canStart}
    >
      <View
        style={[
          styles.cardGradient,
          item.userProgress?.status === 'completed'
            ? styles.cardCompleted
            : item.userProgress?.status === 'in_progress'
            ? styles.cardInProgress
            : styles.cardNotStarted
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.lessonNumber}>
            <Text style={styles.lessonNumberText}>{item.orderIndex}</Text>
          </View>
          <View style={styles.cardTitle}>
            <Text style={styles.lessonTitle}>{item.title}</Text>
            <Text style={styles.lessonTitleMarathi}>{item.titleMarathi}</Text>
          </View>
          <View style={styles.statusIcon}>{getStatusIcon(item.userProgress?.status)}</View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.infoText}>{item.estimatedMinutes} min</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="star-outline" size={16} color="#FFC107" />
              <Text style={styles.infoText}>{item.xpReward} XP</Text>
            </View>
            <View style={styles.infoItem}>
              <View
                style={[
                  styles.levelBadge,
                  { backgroundColor: getLevelColor(item.level) },
                ]}
              >
                <Text style={styles.levelBadgeText}>
                  {item.level.charAt(0).toUpperCase() + item.level.slice(1)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          {item.userProgress?.status === 'completed' && (
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                Score: {item.userProgress.score}% | XP Earned: {item.userProgress.xpEarned}
              </Text>
            </View>
          )}
        </View>

        {!item.canStart && (
          <View style={styles.lockedOverlay}>
            <Ionicons name="lock-closed" size={32} color="#fff" />
            <Text style={styles.lockedText}>Complete previous lessons first</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (
    title: string,
    value: string,
    selectedValue: string,
    onSelect: (value: string) => void
  ) => (
    <TouchableOpacity
      style={[styles.filterButton, selectedValue === value && styles.filterButtonActive]}
      onPress={() => onSelect(value)}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedValue === value && styles.filterButtonTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading lessons...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marathi Lessons</Text>
        <Text style={styles.headerSubtitle}>Choose a lesson to start learning</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search lessons..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Level:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {renderFilterButton('All', 'all', selectedLevel, setSelectedLevel)}
            {renderFilterButton('Beginner', 'beginner', selectedLevel, setSelectedLevel)}
            {renderFilterButton('Intermediate', 'intermediate', selectedLevel, setSelectedLevel)}
            {renderFilterButton('Advanced', 'advanced', selectedLevel, setSelectedLevel)}
          </ScrollView>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Category:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {renderFilterButton('All', 'all', selectedCategory, setSelectedCategory)}
            {categories.map((category) =>
              renderFilterButton(
                category.charAt(0).toUpperCase() + category.slice(1),
                category,
                selectedCategory,
                setSelectedCategory
              )
            )}
          </ScrollView>
        </View>
      </ScrollView>

      {filteredLessons.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No lessons found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLessons}
          renderItem={renderLessonCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filtersContent: {
    paddingHorizontal: 16,
  },
  filterGroup: {
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  lessonCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardGradient: {
    padding: 16,
    borderRadius: 12,
  },
  cardCompleted: {
    backgroundColor: '#4CAF50',
  },
  cardInProgress: {
    backgroundColor: '#FF9800',
  },
  cardNotStarted: {
    backgroundColor: '#ffffff',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lessonNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lessonNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardTitle: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  lessonTitleMarathi: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  statusIcon: {
    marginLeft: 8,
  },
  cardContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 11,
    color: '#666',
  },
  progressInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  progressText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
});

export default LessonListScreen;