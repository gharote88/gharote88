> **Migration Notice**: This spec was written for the original Firebase/Firestore architecture. The app has been fully migrated to **Supabase PostgreSQL + Vercel Serverless Functions**. All Firebase/Firestore references in code examples below are superseded by the implementation in `api/` and `supabase/migrations/`. Refer to `design.md` and `tasks.md` for the current architecture.

---

# Frontend Applications Specification

## Overview
The frontend applications provide the user interface for the Marathi Learning App across Web, iOS, and Android platforms using Expo. This specification covers the UI/UX design, component architecture, and implementation details for creating a cohesive, engaging, and performant cross-platform experience.

## Application Architecture

### 1. Technology Stack
```javascript
{
  framework: "Expo (React Native)",
  language: "TypeScript",
  navigation: "Expo Router",
  stateManagement: "Zustand + React Context",
  styling: "NativeWind (Tailwind CSS) + React Native Reanimated",
  uiComponents: "React Native Paper + Custom Components",
  animations: "Expo Animations + Lottie",
  icons: "React Native Vector Icons",
  forms: "React Hook Form + Zod",
  dataFetching: "React Query + Firebase SDK",
  testing: "Jest + React Native Testing Library",
  buildTools: "EAS Build + EAS Submit"
}
```

### 2. Project Structure
```
app/
├── _layout.tsx           # Root layout with navigation
├── index.tsx             # Home screen
├── (auth)/
│   ├── _layout.tsx       # Auth layout
│   ├── login.tsx         # Login screen
│   └── onboarding.tsx    # Onboarding flow
├── (app)/
│   ├── _layout.tsx       # Main app layout
│   ├── dashboard.tsx     # Dashboard/home
│   ├── journey.tsx       # Journey map
│   ├── lessons/
│   │   ├── _layout.tsx   # Lessons layout
│   │   ├── index.tsx     # Lesson list
│   │   └── [id].tsx      # Lesson detail
│   ├── practice/
│   │   ├── _layout.tsx   # Practice layout
│   │   ├── speaking.tsx  # Speaking practice
│   │   ├── writing.tsx   # Writing practice
│   │   └── reading.tsx   # Reading practice
│   ├── story/
│   │   ├── _layout.tsx   # Story layout
│   │   ├── index.tsx     # Story list
│   │   └── [id].tsx      # Story chapter
│   ├── gamification/
│   │   ├── _layout.tsx   # Gamification layout
│   │   ├── badges.tsx    # Badges
│   │   ├── leaderboard.tsx # Leaderboard
│   │   └── avatar.tsx    # Avatar customization
│   ├── trivia/
│   │   ├── _layout.tsx   # Trivia layout
│   │   ├── index.tsx     # Fact of the day
│   │   └── collection.tsx # Fact collection
│   └── profile/
│       ├── _layout.tsx   # Profile layout
│       ├── index.tsx     # Profile overview
│       └── settings.tsx  # Settings
components/
├── ui/                   # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   └── ...
├── journey/              # Journey-specific components
│   ├── MapCanvas.tsx
│   ├── Avatar.tsx
│   ├── Checkpoint.tsx
│   └── ...
├── lessons/              # Lesson components
│   ├── PhraseCard.tsx
│   ├── AudioPlayer.tsx
│   ├── ProgressBar.tsx
│   └── ...
├── practice/             # Practice components
│   ├── SpeakingExercise.tsx
│   ├── WritingCanvas.tsx
│   ├── ReadingPassage.tsx
│   └── ...
├── gamification/         # Gamification components
│   ├── XPBar.tsx
│   ├── StreakCounter.tsx
│   ├── BadgeCard.tsx
│   └── ...
└── shared/               # Shared components
    ├── LoadingSpinner.tsx
    ├── ErrorBoundary.tsx
    └── ...
hooks/
├── useAuth.ts            # Authentication hook
├── useGamification.ts    # Gamification hook
├── useLessons.ts         # Lessons hook
├── useSpeech.ts          # Speech recognition hook
├── useWriting.ts         # Writing canvas hook
└── ...
stores/
├── authStore.ts          # Authentication state
├── gamificationStore.ts  # Gamification state
├── progressStore.ts      # Progress state
└── ...
utils/
├── firebase.ts           # Firebase utilities
├── audio.ts              # Audio utilities
├── scoring.ts            # Scoring algorithms
└── ...
constants/
├── colors.ts             # Color constants
├── typography.ts         # Typography constants
├── spacing.ts            # Spacing constants
└── ...
types/
├── user.ts               # User types
├── lesson.ts             # Lesson types
├── gamification.ts       # Gamification types
└── ...
```

## Core UI Components

### 1. Navigation System
**Purpose**: Provide seamless navigation across the application.

#### 1.1 Root Layout
```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function RootLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {user ? (
        // Authenticated routes
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      ) : (
        // Unauthenticated routes
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      )}
    </Stack>
  );
}
```

#### 1.2 App Layout
```typescript
// app/(app)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: 'Journey',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lessons"
        options={{
          title: 'Lessons',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="fitness" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

### 2. Dashboard Component
**Purpose**: Provide central hub for user activities and progress.

#### 2.1 Dashboard Screen
```typescript
// app/(app)/dashboard.tsx
import { View, ScrollView, StyleSheet } from 'react-native';
import { useGamification } from '@/hooks/useGamification';
import { useDailyChallenge } from '@/hooks/useDailyChallenge';
import XPBar from '@/components/gamification/XPBar';
import StreakCounter from '@/components/gamification/StreakCounter';
import DailyChallengeCard from '@/components/gamification/DailyChallengeCard';
import FactOfTheDay from '@/components/trivia/FactOfTheDay';
import ContinueLearning from '@/components/lessons/ContinueLearning';

export default function Dashboard() {
  const { userXP, level, streak } = useGamification();
  const { dailyChallenge } = useDailyChallenge();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <XPBar currentXP={userXP} level={level} />
        <StreakCounter streak={streak} />
      </View>

      <DailyChallengeCard challenge={dailyChallenge} />

      <FactOfTheDay />

      <ContinueLearning />

      <View style={styles.quickActions}>
        {/* Quick action buttons */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  quickActions: {
    padding: 16,
  },
});
```

### 3. Journey Map Component
**Purpose**: Display interactive journey map with user progress.

#### 3.1 Map Canvas Component
```typescript
// components/journey/MapCanvas.tsx
import { View, StyleSheet } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useJourney } from '@/hooks/useJourney';
import Avatar from './Avatar';
import Checkpoint from './Checkpoint';

export default function MapCanvas() {
  const { journeyData, userPosition } = useJourney();

  const mapPath = Skia.Path.Make();
  // Draw route path
  journeyData.checkpoints.forEach((checkpoint, index) => {
    if (index === 0) {
      mapPath.moveTo(checkpoint.position.x, checkpoint.position.y);
    } else {
      mapPath.lineTo(checkpoint.position.x, checkpoint.position.y);
    }
  });

  return (
    <View style={styles.container}>
      <Canvas style={styles.canvas}>
        <Path
          path={mapPath}
          color="#FF6B35"
          style="stroke"
          strokeWidth={4}
        />
        
        {journeyData.checkpoints.map((checkpoint) => (
          <Checkpoint
            key={checkpoint.id}
            checkpoint={checkpoint}
            isCompleted={checkpoint.completed}
            isCurrent={checkpoint.isCurrent}
          />
        ))}
        
        <Avatar position={userPosition} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
  canvas: {
    flex: 1,
  },
});
```

#### 3.2 Avatar Component
```typescript
// components/journey/Avatar.tsx
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useAvatar } from '@/hooks/useAvatar';

interface AvatarProps {
  position: { x: number; y: number };
}

export default function Avatar({ position }: AvatarProps) {
  const { avatarItems } = useAvatar();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.avatar,
        {
          left: position.x - 25,
          top: position.y - 25,
        },
        animatedStyle,
      ]}
    >
      {/* Render avatar based on equipped items */}
      <View style={styles.avatarBody}>
        {/* Avatar rendering logic */}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarBody: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
});
```

### 4. Lesson Components
**Purpose**: Provide interactive lesson content and exercises.

#### 4.1 Phrase Card Component
```typescript
// components/lessons/PhraseCard.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

interface PhraseCardProps {
  marathiText: string;
  transliteration: string;
  englishMeaning: string;
  audioUrl: string;
}

export default function PhraseCard({
  marathiText,
  transliteration,
  englishMeaning,
  audioUrl,
}: PhraseCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = async () => {
    try {
      setIsPlaying(true);
      const sound = new Audio.Sound();
      await sound.loadAsync({ uri: audioUrl });
      await sound.playAsync();
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.audioButton} onPress={playAudio}>
        <Ionicons
          name={isPlaying ? 'volume-high' : 'play'}
          size={24}
          color="#FF6B35"
        />
      </TouchableOpacity>
      
      <View style={styles.content}>
        <Text style={styles.marathiText}>{marathiText}</Text>
        <Text style={styles.transliteration}>{transliteration}</Text>
        <Text style={styles.englishMeaning}>{englishMeaning}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  audioButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  marathiText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  transliteration: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 4,
  },
  englishMeaning: {
    fontSize: 14,
    color: '#999',
  },
});
```

#### 4.2 Lesson Flow Component
```typescript
// components/lessons/LessonFlow.tsx
import { View, StyleSheet } from 'react-native';
import { useLessonFlow } from '@/hooks/useLessonFlow';
import LessonIntro from './LessonIntro';
import VocabularySection from './VocabularySection';
import SpeakingPractice from './SpeakingPractice';
import WritingPractice from './WritingPractice';
import ReadingPractice from './ReadingPractice';
import MiniGame from './MiniGame';
import Quiz from './Quiz';
import LessonCompletion from './LessonCompletion';

export default function LessonFlow({ lessonId }: { lessonId: string }) {
  const { currentStep, lessonData, progress } = useLessonFlow(lessonId);

  const renderStep = () => {
    switch (currentStep) {
      case 'intro':
        return <LessonIntro lesson={lessonData} />;
      case 'vocabulary':
        return <VocabularySection phrases={lessonData.phrases} />;
      case 'speaking':
        return <SpeakingPractice phrases={lessonData.phrases} />;
      case 'writing':
        return <WritingPractice exercises={lessonData.writingExercises} />;
      case 'reading':
        return <ReadingPractice passage={lessonData.readingPassage} />;
      case 'minigame':
        return <MiniGame game={lessonData.miniGame} />;
      case 'quiz':
        return <Quiz questions={lessonData.quizQuestions} />;
      case 'completion':
        return <LessonCompletion progress={progress} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ProgressBar progress={progress} />
      {renderStep()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
});
```

### 5. Practice Components
**Purpose**: Provide specialized practice interfaces for each skill.

#### 5.1 Speaking Exercise Component
```typescript
// components/practice/SpeakingExercise.tsx
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { useState } from 'react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import WaveformVisualizer from './WaveformVisualizer';
import ScoreDisplay from './ScoreDisplay';

interface SpeakingExerciseProps {
  targetPhrase: string;
  audioUrl: string;
}

export default function SpeakingExercise({
  targetPhrase,
  audioUrl,
}: SpeakingExerciseProps) {
  const [isRecording, setIsRecording] = useState(false);
  const { transcribe, score, loading } = useSpeechRecognition();

  const startRecording = async () => {
    try {
      setIsRecording(true);
      await transcribe(targetPhrase);
    } catch (error) {
      console.error('Recording error:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.targetPhrase}>
        <Text style={styles.phraseText}>{targetPhrase}</Text>
        <TouchableOpacity onPress={() => {/* Play audio */}}>
          <Ionicons name="volume-high" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      <WaveformVisualizer isRecording={isRecording} />

      <TouchableOpacity
        style={[
          styles.recordButton,
          isRecording && styles.recordButtonActive,
        ]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={loading}
      >
        <Ionicons
          name={isRecording ? 'stop' : 'mic'}
          size={32}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      {score !== null && <ScoreDisplay score={score} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  targetPhrase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  phraseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: '#F44336',
  },
});
```

#### 5.2 Writing Canvas Component
```typescript
// components/practice/WritingCanvas.tsx
import { View, StyleSheet } from 'react-native';
import { useRef, useState } from 'react';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useWritingRecognition } from '@/hooks/useWritingRecognition';

interface WritingCanvasProps {
  targetCharacter: string;
  referenceStrokes: any[];
  onComplete: (score: number) => void;
}

export default function WritingCanvas({
  targetCharacter,
  referenceStrokes,
  onComplete,
}: WritingCanvasProps) {
  const [strokes, setStrokes] = useState<any[]>([]);
  const [currentPath, setCurrentPath] = useState<any>(null);
  const { score, evaluate } = useWritingRecognition();

  const panGesture = Gesture.Pan()
    .onStart((event) => {
      setCurrentPath(Skia.Path.Make());
      currentPath?.moveTo(event.x, event.y);
    })
    .onUpdate((event) => {
      currentPath?.lineTo(event.x, event.y);
    })
    .onEnd(() => {
      if (currentPath) {
        setStrokes([...strokes, currentPath]);
        setCurrentPath(null);
        
        // Evaluate after complete character
        if (strokes.length + 1 >= referenceStrokes.length) {
          const evaluationScore = evaluate(strokes, referenceStrokes);
          onComplete(evaluationScore);
        }
      }
    });

  const clearCanvas = () => {
    setStrokes([]);
    setCurrentPath(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.targetDisplay}>
        <Text style={styles.targetText}>{targetCharacter}</Text>
      </View>

      <GestureDetector gesture={panGesture}>
        <Canvas style={styles.canvas}>
          {/* Reference strokes */}
          {referenceStrokes.map((stroke, index) => (
            <Path
              key={`ref-${index}`}
              path={stroke.path}
              color="#E0E0E0"
              style="stroke"
              strokeWidth={3}
            />
          ))}

          {/* User strokes */}
          {strokes.map((stroke, index) => (
            <Path
              key={`user-${index}`}
              path={stroke}
              color="#4CAF50"
              style="stroke"
              strokeWidth={3}
            />
          ))}

          {/* Current stroke */}
          {currentPath && (
            <Path
              path={currentPath}
              color="#FF6B35"
              style="stroke"
              strokeWidth={3}
            />
          )}
        </Canvas>
      </GestureDetector>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.clearButton} onPress={clearCanvas}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {score !== null && <ScoreDisplay score={score} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  targetDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  targetText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  canvas: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  clearButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#F44336',
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
```

### 6. Gamification Components
**Purpose**: Display gamification elements and rewards.

#### 6.1 XP Bar Component
```typescript
// components/gamification/XPBar.tsx
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { useGamification } from '@/hooks/useGamification';

export default function XPBar({ currentXP, level }: { currentXP: number; level: number }) {
  const { getXPToNextLevel } = useGamification();
  const { xpNeeded, progress } = getXPToNextLevel(currentXP);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.levelText}>Level {level}</Text>
        <Text style={styles.xpText}>{currentXP} XP</Text>
      </View>
      
      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <Animated.View
            style={[
              styles.barFill,
              {
                width: animatedValue.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.xpNeededText}>{xpNeeded} XP to next level</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  xpText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  barContainer: {
    marginTop: 8,
  },
  barBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  xpNeededText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
});
```

#### 6.2 Badge Card Component
```typescript
// components/gamification/BadgeCard.tsx
import { View, Text, StyleSheet, Image } from 'react-native';
import LottieView from 'lottie-react-native';

interface BadgeCardProps {
  badge: {
    name: string;
    description: string;
    iconUrl: string;
    earned: boolean;
  };
}

export default function BadgeCard({ badge }: BadgeCardProps) {
  return (
    <View style={[styles.card, !badge.earned && styles.cardLocked]}>
      <View style={styles.iconContainer}>
        {badge.earned ? (
          <Image source={{ uri: badge.iconUrl }} style={styles.icon} />
        ) : (
          <View style={styles.lockedIcon}>
            <Ionicons name="lock-closed" size={32} color="#999" />
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.name, !badge.earned && styles.nameLocked]}>
          {badge.name}
        </Text>
        <Text style={[styles.description, !badge.earned && styles.descriptionLocked]}>
          {badge.description}
        </Text>
      </View>
      
      {badge.earned && (
        <LottieView
          source={require('@/assets/animations/badge-unlock.json')}
          autoPlay
          loop={false}
          style={styles.animation}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardLocked: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 64,
    height: 64,
    marginRight: 16,
  },
  icon: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  lockedIcon: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  nameLocked: {
    color: '#999',
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
  descriptionLocked: {
    color: '#999',
  },
  animation: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 40,
    height: 40,
  },
});
```

## Design System

### 1. Color Palette
```typescript
// constants/colors.ts
export const Colors = {
  primary: '#FF6B35',
  secondary: '#004E89',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: {
    primary: '#333333',
    secondary: '#666666',
    disabled: '#999999',
  },
  skill: {
    speaking: '#4CAF50',
    writing: '#2196F3',
    reading: '#FF9800',
  },
  gamification: {
    xp: '#FFD700',
    streak: '#FF5722',
    badge: '#9C27B0',
    leaderboard: '#2196F3',
  },
};
```

### 2. Typography
```typescript
// constants/typography.ts
export const Typography = {
  fontFamily: {
    primary: 'Poppins',
    secondary: 'Open Sans',
    marathi: 'Noto Sans Devanagari',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};
```

### 3. Spacing
```typescript
// constants/spacing.ts
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};
```

## Performance Optimization

### 1. Code Splitting
```typescript
// Dynamic imports for heavy components
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// Usage with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <HeavyComponent />
</Suspense>
```

### 2. Image Optimization
```typescript
// Use optimized image formats
<Image
  source={{
    uri: imageUrl,
    width: 200,
    height: 200,
  }}
  resizeMode="cover"
  // Use WebP format with fallback
  defaultSource={require('@/assets/images/fallback.png')}
/>
```

### 3. Memoization
```typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
});

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);
```

### 4. List Optimization
```typescript
// Use FlatList with proper optimization
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
  initialNumToRender={10}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

## Accessibility

### 1. Screen Reader Support
```typescript
// Add accessibility labels
<TouchableOpacity
  accessibilityLabel="Play audio pronunciation"
  accessibilityHint="Plays the Marathi pronunciation of this phrase"
  onPress={playAudio}
>
  <Ionicons name="volume-high" size={24} color="#FF6B35" />
</TouchableOpacity>
```

### 2. Keyboard Navigation
```typescript
// Support keyboard navigation
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  onAccessibilityTap={handlePress}
>
  Button content
</TouchableOpacityableOpacity>
```

### 3. Color Contrast
```typescript
// Ensure WCAG AA compliant contrast ratios
const styles = StyleSheet.create({
  text: {
    color: '#333333', // Dark gray on white background
    backgroundColor: '#FFFFFF',
  },
});
```

## Testing Strategy

### 1. Component Testing
```typescript
// Example component test
import { render, fireEvent } from '@testing-library/react-native';
import PhraseCard from '@/components/lessons/PhraseCard';

describe('PhraseCard', () => {
  it('renders phrase text correctly', () => {
    const { getByText } = render(
      <PhraseCard
        marathiText="नमस्कार"
        transliteration="Namaskār"
        englishMeaning="Hello"
        audioUrl="test.mp3"
      />
    );
    
    expect(getByText('नमस्कार')).toBeTruthy();
    expect(getByText('Namaskār')).toBeTruthy();
    expect(getByText('Hello')).toBeTruthy();
  });

  it('plays audio when button is pressed', async () => {
    const { getByRole } = render(
      <PhraseCard
        marathiText="नमस्कार"
        transliteration="Namaskār"
        englishMeaning="Hello"
        audioUrl="test.mp3"
      />
    );
    
    const button = getByRole('button');
    fireEvent.press(button);
    
    // Assert audio playback
  });
});
```

### 2. Integration Testing
```typescript
// Example integration test
import { render, waitFor } from '@testing-library/react-native';
import Dashboard from '@/app/(app)/dashboard';

describe('Dashboard Integration', () => {
  it('displays user gamification data', async () => {
    const { getByText } = render(<Dashboard />);
    
    await waitFor(() => {
      expect(getByText('Level 1')).toBeTruthy();
      expect(getByText('0 XP')).toBeTruthy();
    });
  });
});
```

### 3. E2E Testing
```typescript
// Example E2E test with Detox
describe('Learning Flow', () => {
  it('completes a full lesson', async () => {
    await element(by.id('lesson-card-1')).tap();
    await element(by.id('start-lesson')).tap();
    
    // Complete vocabulary section
    await element(by.id('next-button')).tap();
    
    // Complete speaking practice
    await element(by.id('record-button')).tap();
    await waitFor(element(by.id('stop-button')).toBeVisible());
    await element(by.id('stop-button')).tap();
    
    // Verify completion
    await expect(element(by.id('completion-screen'))).toBeVisible();
  });
});
```

## Deployment Strategy

### 1. Build Configuration
```typescript
// app.config.js
export default {
  expo: {
    name: 'Marathi Learning App',
    slug: 'marathi-learning-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      bundleIdentifier: 'com.marathilearning.app',
      buildNumber: '1',
    },
    android: {
      package: 'com.marathilearning.app',
      versionCode: 1,
    },
    web: {
      favicon: './assets/favicon.png',
    },
  },
};
```

### 2. EAS Build Configuration
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "ios": {
        "autoIncrement": true
      },
      "android": {
        "autoIncrement": true
      }
    }
  }
}
```

### 3. Submit Configuration
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id",
        "ascAppId": "your-app-store-connect-id",
        "appleTeamId": "your-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json"
      }
    }
  }
}
```

## Success Metrics

### 1. Performance Metrics
- **App Launch Time**: < 3 seconds
- **Screen Transition Time**: < 500ms
- **Memory Usage**: < 150MB
- **Battery Impact**: Minimal
- **Network Usage**: Optimized

### 2. User Experience Metrics
- **Crash Rate**: < 0.1%
- **ANR Rate**: < 0.05%
- **Load Success Rate**: > 99.5%
- **User Satisfaction**: > 4.5/5
- **Task Completion Rate**: > 85%

### 3. Business Metrics
- **Daily Active Users**: Target growth
- **Session Duration**: > 10 minutes
- **Retention Rate**: > 40% (30-day)
- **Conversion Rate**: > 5% (free to premium)
- **User Rating**: > 4.5 stars

## Future Enhancements

### 1. Advanced Features
- **AI-Powered Personalization**: Adaptive learning paths
- **Voice Assistant**: Integrated voice commands
- **AR Experiences**: Augmented reality learning
- **Social Features**: Community and collaboration
- **Offline Mode**: Enhanced offline capabilities

### 2. Platform-Specific Features
- **iOS Widgets**: Home screen widgets
- **Android App Shortcuts**: Quick actions
- **Web PWA**: Enhanced web experience
- **Desktop Support**: Cross-platform expansion

### 3. Technology Upgrades
- **Performance Improvements**: Faster rendering and animations
- **Battery Optimization**: Reduced power consumption
- **Security Enhancements**: Advanced security features
- **Accessibility Improvements**: Enhanced support for disabilities
