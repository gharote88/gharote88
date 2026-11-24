import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

interface Avatar {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  category: string;
}

interface RouteParams {
  selectedCity: {
    id: string;
    name: string;
    marathiName: string;
  };
}

const AvatarSelectionScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ selectedCityJson?: string }>();
  const selectedCity = params.selectedCityJson ? JSON.parse(params.selectedCityJson) : null;
  
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Avatar data
  const avatars: Avatar[] = [
    {
      id: 'avatar_student',
      name: 'Student',
      imageUrl: 'https://storage.googleapis.com/marathi-learning-app/avatars/student.png',
      description: 'Ready to learn and explore',
      category: 'people',
    },
    {
      id: 'avatar_traveler',
      name: 'Traveler',
      imageUrl: 'https://storage.googleapis.com/marathi-learning-app/avatars/traveler.png',
      description: 'Adventure awaits!',
      category: 'people',
    },
    {
      id: 'avatar_teacher',
      name: 'Teacher',
      imageUrl: 'https://storage.googleapis.com/marathi-learning-app/avatars/teacher.png',
      description: 'Knowledge seeker',
      category: 'people',
    },
    {
      id: 'avatar_artist',
      name: 'Artist',
      imageUrl: 'https://storage.googleapis.com/marathi-learning-app/avatars/artist.png',
      description: 'Creative spirit',
      category: 'people',
    },
    {
      id: 'avatar_peacock',
      name: 'Peacock',
      imageUrl: 'https://storage.googleapis.com/marathi-learning-app/avatars/peacock.png',
      description: 'National bird of India',
      category: 'animals',
    },
    {
      id: 'avatar_tiger',
      name: 'Tiger',
      imageUrl: 'https://storage.googleapis.com/marathi-learning-app/avatars/tiger.png',
      description: 'Majestic and powerful',
      category: 'animals',
    },
    {
      id: 'avatar_elephant',
      name: 'Elephant',
      imageUrl: 'https://storage.googleapis.com/marathi-learning-app/avatars/elephant.png',
      description: 'Wisdom and strength',
      category: 'animals',
    },
    {
      id: 'avatar_monkey',
      name: 'Monkey',
      imageUrl: 'https://storage.googleapis.com/marathi-learning-app/avatars/monkey.png',
      description: 'Playful and clever',
      category: 'animals',
    },
  ];

  const categories = [
    { id: 'all', name: 'All', emoji: '🌟' },
    { id: 'people', name: 'People', emoji: '👥' },
    { id: 'animals', name: 'Animals', emoji: '🐾' },
  ];

  const filteredAvatars = selectedCategory === 'all' 
    ? avatars 
    : avatars.filter(avatar => avatar.category === selectedCategory);

  const handleAvatarSelect = (avatar: Avatar) => {
    setSelectedAvatar(avatar);
    Animated.spring(scaleAnim, {
      toValue: 1.1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleContinue = () => {
    if (selectedAvatar && selectedCity) {
      router.push({
        pathname: '/onboarding/profile-setup',
        params: {
          selectedCityJson: JSON.stringify(selectedCity),
          selectedAvatarJson: JSON.stringify({ id: selectedAvatar.id, name: selectedAvatar.name, imageUrl: selectedAvatar.imageUrl }),
        },
      });
    }
  };

  const renderAvatarCard = (avatar: Avatar) => {
    const isSelected = selectedAvatar?.id === avatar.id;

    return (
      <TouchableOpacity
        key={avatar.id}
        style={[
          styles.avatarCard,
          isSelected && styles.selectedAvatarCard,
        ]}
        onPress={() => handleAvatarSelect(avatar)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarImageContainer}>
          <Image
            source={{ uri: avatar.imageUrl }}
            style={styles.avatarImage}
            defaultSource={require('../../assets/images/placeholder-avatar.png')}
          />
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>✓</Text>
            </View>
          )}
        </View>
        <Text style={styles.avatarName}>{avatar.name}</Text>
        <Text style={styles.avatarDescription} numberOfLines={1}>
          {avatar.description}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Avatar</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Selected City Info */}
      {selectedCity && (
        <View style={styles.cityInfoBanner}>
          <Text style={styles.cityInfoText}>
            Starting from <Text style={styles.cityNameText}>{selectedCity.name}</Text> ({selectedCity.marathiName})
          </Text>
        </View>
      )}

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.selectedCategoryButton,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.selectedCategoryText,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Avatar Grid */}
      <ScrollView
        style={styles.avatarGrid}
        contentContainerStyle={styles.avatarGridContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridContainer}>
          {filteredAvatars.map(renderAvatarCard)}
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedAvatar && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={!selectedAvatar}
        >
          <Animated.Text
            style={[
              styles.continueButtonText,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            Continue as {selectedAvatar?.name || '...'}
          </Animated.Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  backButtonText: {
    fontSize: 24,
    color: '#333333',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  placeholder: {
    width: 40,
  },
  cityInfoBanner: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cityInfoText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'OpenSans-Regular',
  },
  cityNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B35',
    fontFamily: 'Poppins-Bold',
  },
  categoryContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  selectedCategoryButton: {
    backgroundColor: '#FF6B35',
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  avatarGrid: {
    flex: 1,
  },
  avatarGridContent: {
    padding: 16,
    paddingBottom: 100,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  avatarCard: {
    width: (width - 48) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedAvatarCard: {
    borderColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  selectedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF6B35',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  avatarName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  avatarDescription: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    fontFamily: 'OpenSans-Regular',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  continueButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 30,
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
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
});

export default AvatarSelectionScreen;