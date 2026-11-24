
// Export Supabase configuration and auth utilities
export * from './supabase';
export * from './supabaseAuth';

// Core Types
export type UserRole = 'learner' | 'parent';
export type Level = 'beginner' | 'intermediate' | 'advanced';
export type LessonStatus = 'not_started' | 'in_progress' | 'completed';
export type QuizType = 'multiple_choice' | 'fill_blank' | 'match_pair' | 'speak_answer';
export type WritingCharacterType = 'vowel' | 'consonant' | 'conjunct';
export type WritingLessonType = 'characters' | 'words' | 'sentences';
export type ReadingPassageType = 'words' | 'sentences' | 'paragraph' | 'story';
export type ComprehensionQuestionType = 'multiple_choice' | 'true_false' | 'short_answer';
export type ChallengeType = 'quiz' | 'speaking' | 'writing' | 'reading' | 'mini_game';
export type MiniGameType =
  | 'word_scramble'
  | 'phrase_builder'
  | 'audio_matching'
  | 'rapid_fire'
  | 'reading_speed_race'
  | 'character_tracing_race';
export type StorySceneType = 'dialogue' | 'read_sign' | 'write_note' | 'mixed';
export type FactCategory = 'history' | 'literature' | 'culture' | 'food' | 'nature' | 'festivals';
export type XpSource =
  | 'lesson'
  | 'quiz'
  | 'speaking'
  | 'writing'
  | 'reading'
  | 'daily_challenge'
  | 'streak_bonus'
  | 'fact_quiz'
  | 'mini_game';
export type AvatarCategory = 'hair' | 'outfit' | 'accessory' | 'background';

// User interface
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  age: number;
  role: UserRole;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  level: number;
  xp: number;
  streak: number;
  lastActiveDate: string;
  settings: UserSettings;
  avatar: UserAvatar;
}

export interface UserSettings {
  language: string;
  notifications: boolean;
  soundEffects: boolean;
  hapticFeedback: boolean;
  autoPlayAudio: boolean;
}

export interface UserAvatar {
  hair: string;
  outfit: string;
  accessory: string;
  background: string;
}

// Lesson interfaces
export interface Lesson {
  id: string;
  title: string;
  titleMarathi: string;
  level: Level;
  topic: string;
  orderIndex: number;
  estimatedMinutes: number;
  description: string;
  descriptionMarathi: string;
  imageUrl: string;
  phrases: Phrase[];
  createdAt: string;
  updatedAt: string;
}

export interface Phrase {
  id: string;
  lessonId: string;
  marathiText: string;
  transliteration: string;
  englishMeaning: string;
  audioUrl: string;
  orderIndex: number;
  difficulty: number;
}

// Progress interfaces
export interface UserProgress {
  id: string;
  userId: string;
  lessonId: string;
  status: LessonStatus;
  score: number;
  completedAt: string | null;
  startedAt: string;
  phraseProgress: PhraseProgress[];
}

export interface PhraseProgress {
  phraseId: string;
  completed: boolean;
  attempts: number;
  lastAttemptAt: string;
}

// Gamification interfaces
export interface UserStreak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  streakFreezeAvailable: boolean;
  streakFreezeUsedAt: string | null;
}

export interface UserXp {
  id: string;
  userId: string;
  totalXp: number;
  level: number;
  levelTitle: string;
  xpToNextLevel: number;
  xpProgress: number;
}

export interface XpTransaction {
  id: string;
  userId: string;
  amount: number;
  source: XpSource;
  reason: string;
  timestamp: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  unlockedAt: string;
  progress: number;
}

export interface Badge {
  id: string;
  name: string;
  nameMarathi: string;
  description: string;
  descriptionMarathi: string;
  iconUrl: string;
  category: string;
  requirement: number;
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface DailyChallenge {
  id: string;
  date: string;
  type: ChallengeType;
  title: string;
  titleMarathi: string;
  description: string;
  descriptionMarathi: string;
  xpReward: number;
  completed: boolean;
  completedAt: string | null;
}

// Quiz interfaces
export interface Quiz {
  id: string;
  lessonId: string;
  type: QuizType;
  question: string;
  questionMarathi: string;
  options: QuizOption[];
  correctAnswer: number;
  explanation: string;
  explanationMarathi: string;
  difficulty: number;
}

export interface QuizOption {
  id: string;
  text: string;
  textMarathi: string;
  isCorrect: boolean;
}

export interface UserQuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timeTaken: number;
  attemptedAt: string;
}

// Writing interfaces
export interface WritingCharacter {
  id: string;
  type: WritingCharacterType;
  character: string;
  transliteration: string;
  englishMeaning: string;
  strokeOrder: string[];
  difficulty: number;
  imageUrl: string;
}

export interface WritingLesson {
  id: string;
  type: WritingLessonType;
  title: string;
  titleMarathi: string;
  level: Level;
  characters: string[];
  orderIndex: number;
  estimatedMinutes: number;
}

export interface UserWritingAttempt {
  id: string;
  userId: string;
  characterId: string;
  strokes: StrokeData[];
  score: number;
  accuracy: number;
  completedAt: string;
}

export interface StrokeData {
  x: number;
  y: number;
  timestamp: number;
}

// Reading interfaces
export interface ReadingPassage {
  id: string;
  type: ReadingPassageType;
  title: string;
  titleMarathi: string;
  content: string;
  contentMarathi: string;
  level: Level;
  orderIndex: number;
  estimatedMinutes: number;
  vocabulary: VocabularyItem[];
  questions: ComprehensionQuestion[];
}

export interface VocabularyItem {
  id: string;
  word: string;
  wordMarathi: string;
  transliteration: string;
  englishMeaning: string;
  audioUrl: string;
}

export interface ComprehensionQuestion {
  id: string;
  type: ComprehensionQuestionType;
  question: string;
  questionMarathi: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface UserReadingAttempt {
  id: string;
  userId: string;
  passageId: string;
  timeSpent: number;
  wordsRead: number;
  quizScore: number;
  completedAt: string;
}

// Speaking interfaces
export interface SpeakingExercise {
  id: string;
  lessonId: string;
  phraseId: string;
  targetPhrase: string;
  targetPhraseMarathi: string;
  difficulty: number;
  audioUrl: string;
}

export interface UserSpeakingAttempt {
  id: string;
  userId: string;
  exerciseId: string;
  audioUrl: string;
  transcription: string;
  score: number;
  accuracy: number;
  completedAt: string;
}

// Story interfaces
export interface Story {
  id: string;
  title: string;
  titleMarathi: string;
  description: string;
  descriptionMarathi: string;
  level: Level;
  orderIndex: number;
  estimatedMinutes: number;
  imageUrl: string;
  scenes: StoryScene[];
}

export interface StoryScene {
  id: string;
  storyId: string;
  type: StorySceneType;
  orderIndex: number;
  dialogue: StoryDialogue[];
  objectives: StoryObjective[];
}

export interface StoryDialogue {
  id: string;
  speaker: string;
  speakerMarathi: string;
  text: string;
  textMarathi: string;
  audioUrl: string;
}

export interface StoryObjective {
  id: string;
  type: 'read' | 'speak' | 'write' | 'choose';
  description: string;
  descriptionMarathi: string;
  completed: boolean;
}

export interface UserStoryProgress {
  id: string;
  userId: string;
  storyId: string;
  currentSceneId: string;
  completed: boolean;
  completedAt: string | null;
  startedAt: string;
}

// Cultural trivia interfaces
export interface CulturalFact {
  id: string;
  category: FactCategory;
  title: string;
  titleMarathi: string;
  content: string;
  contentMarathi: string;
  imageUrl: string;
  difficulty: number;
}

export interface FactQuiz {
  id: string;
  factId: string;
  question: string;
  questionMarathi: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  explanationMarathi: string;
}

export interface UserFactQuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  attemptedAt: string;
}

// Journey interfaces
export interface Journey {
  id: string;
  title: string;
  titleMarathi: string;
  description: string;
  descriptionMarathi: string;
  level: Level;
  orderIndex: number;
  lessons: string[];
  totalXp: number;
  imageUrl: string;
}

export interface UserJourneyProgress {
  id: string;
  userId: string;
  journeyId: string;
  completedLessons: string[];
  currentLessonId: string;
  completed: boolean;
  completedAt: string | null;
  startedAt: string;
}
