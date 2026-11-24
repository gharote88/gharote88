> **Migration Notice**: This spec was written for the original Firebase/Firestore architecture. The app has been fully migrated to **Supabase PostgreSQL + Vercel Serverless Functions**. All Firebase/Firestore references in code examples below are superseded by the implementation in `api/` and `supabase/migrations/`. Refer to `design.md` and `tasks.md` for the current architecture.

---

# Learning Modules Specification

## Overview
The learning modules form the core educational content of the Marathi Learning App, providing structured, interactive lessons across three key skills: speaking, writing, and reading. Each module is designed to be engaging, gamified, and progressively challenging.

## Module Architecture

### 1. Lesson Structure
**Purpose**: Provide a consistent, engaging framework for all learning content.

**Lesson Flow**:
```
1. Introduction (30 seconds)
   - Welcome animation
   - Learning objectives
   - Topic overview
   - Estimated time

2. Vocabulary Learning (3-5 minutes)
   - Phrase cards with Devanagari, transliteration, English
   - Audio pronunciation for each phrase
   - Visual examples and context
   - Interactive flashcards

3. Speaking Practice (2-3 minutes)
   - Listen & repeat exercises
   - Real-time pronunciation feedback
   - Score and progress tracking
   - Retry and improvement options

4. Writing Practice (2-3 minutes)
   - Character tracing exercises
   - Stroke order guidance
   - Handwriting recognition
   - Accuracy scoring

5. Reading Practice (2-3 minutes)
   - Short passages using lesson vocabulary
   - Tap-to-define vocabulary
   - Comprehension questions
   - Reading speed tracking

6. Mini-Game (1-2 minutes)
   - Fun reinforcement activity
   - Gamified practice
   - Bonus XP opportunities

7. Quiz (2-3 minutes)
   - Multiple question types
   - Knowledge assessment
   - Immediate feedback
   - XP rewards

8. Completion (30 seconds)
   - Celebration animation
   - Progress summary
   - XP and badge awards
   - Next lesson preview
```

**Lesson Data Structure**:
```javascript
lessons/{lessonId}
{
  title: "Greetings and Introductions",
  titleMarathi: "नमस्कार आणि परिचय",
  level: "beginner",
  topic: "greetings",
  orderIndex: 1,
  estimatedMinutes: 15,
  learningObjectives: [
    "Learn basic Marathi greetings",
    "Practice pronunciation",
    "Write simple greetings",
    "Read greeting phrases"
  ],
  associatedTriviaId: "trivia_greetings",
  content: {
    introduction: {
      text: "Welcome to your first Marathi lesson!",
      marathiText: "आपले पहिले मराठी धडे सुरू करूया!",
      audioUrl: "https://storage.googleapis.com/..."
    },
    phrases: ["phrase_1", "phrase_2", "phrase_3"],
    writingExercises: ["writing_1", "writing_2"],
    readingPassage: "reading_1",
    miniGame: "game_1",
    quizQuestions: ["quiz_1", "quiz_2", "quiz_3"]
  },
  xpReward: 50,
  unlocks: {
    nextLesson: "lesson_2",
    badges: ["badge_first_lesson"]
  }
}
```

### 2. Speaking Module
**Purpose**: Develop pronunciation and speaking skills through interactive exercises.

#### 2.1 Listen & Repeat Exercises
**Component Specifications**:

**PhraseCard**:
```javascript
phrases/{phraseId}
{
  lessonId: "lesson_1",
  marathiText: "नमस्कार",
  transliteration: "Namaskār",
  englishMeaning: "Hello",
  audioUrl: "https://storage.googleapis.com/audio/namaskar.mp3",
  audioDuration: 1.5,
  difficulty: "easy",
  context: "Used as a formal greeting",
  examples: [
    "नमस्कार, कसे आहात?", // "Hello, how are you?"
    "नमस्कार, मी ठीक आहे."  // "Hello, I am fine."
  ],
  orderIndex: 1
}
```

**SpeakingExercise**:
- **Audio Playback**: Native pronunciation with play/pause controls
- **Recording**: User records their attempt
- **Waveform Visualization**: Real-time audio waveform display
- **Scoring**: Immediate pronunciation score (0-100)
- **Feedback**: Specific improvement suggestions
- **Retry**: Unlimited attempts with progress tracking

**Scoring Algorithm**:
```javascript
async function scorePronunciation(userAudio, expectedPhrase) {
  // Transcribe user audio using OpenAI Whisper
  const transcription = await transcribeAudio(userAudio);
  
  // Normalize both texts (remove spaces, diacritics)
  const normalizedUser = normalizeMarathi(transcription.text);
  const normalizedExpected = normalizeMarathi(expectedPhrase);
  
  // Calculate Levenshtein distance
  const distance = levenshteinDistance(normalizedUser, normalizedExpected);
  const maxLength = Math.max(normalizedUser.length, normalizedExpected.length);
  
  // Calculate similarity score
  const similarityScore = (1 - distance / maxLength) * 100;
  
  // Add confidence bonus
  const confidenceBonus = transcription.confidence > 0.8 ? 10 : 0;
  
  // Final score (clamped to 0-100)
  const finalScore = Math.min(100, Math.max(0, similarityScore + confidenceBonus));
  
  return {
    score: finalScore,
    transcription: transcription.text,
    feedback: generateFeedback(finalScore, normalizedUser, normalizedExpected),
    confidence: transcription.confidence
  };
}

function generateFeedback(score, userText, expectedText) {
  if (score >= 90) {
    return "Excellent! Your pronunciation is perfect.";
  } else if (score >= 70) {
    return "Great job! Pay attention to " + identifyDifferences(userText, expectedText);
  } else if (score >= 50) {
    return "Good effort! Try to focus on " + identifyDifferences(userText, expectedText);
  } else {
    return "Keep practicing! Listen to the native pronunciation again.";
  }
}
```

#### 2.2 Conversational Practice
**Purpose**: Develop real-world speaking skills through dialogue exercises.

**Dialogue Structure**:
```javascript
dialogues/{dialogueId}
{
  lessonId: "lesson_5",
  title: "At the Market",
  scenario: "Buying vegetables at a local market",
  characters: [
    {
      name: "Shopkeeper",
      marathiName: "दुकानदार",
      role: "seller"
    },
    {
      name: "Customer",
      marathiName: "ग्राहक",
      role: "buyer"
    }
  ],
  lines: [
    {
      speaker: "Shopkeeper",
      marathiText: "नमस्कार, काय घ्याल?",
      transliteration: "Namaskār, kāy ghyāl?",
      englishMeaning: "Hello, what would you like?",
      audioUrl: "https://storage.googleapis.com/...",
      userResponse: true
    },
    {
      speaker: "Customer",
      marathiText: "मला टोमॅटो दोन किलो द्या.",
      transliteration: "Malā ṭomāṭo don kīlō dyā.",
      englishMeaning: "Please give me two kilos of tomatoes.",
      audioUrl: "https://storage.googleapis.com/...",
      userResponse: false
    }
    // ... more lines
  ],
  xpReward: 30
}
```

**DialogueExercise**:
- **Role Selection**: Choose which character to play
- **Line-by-Line Practice**: Practice each line individually
- **Full Dialogue**: Complete conversation practice
- **Context Hints**: Visual context and scenario description
- **Progress Tracking**: Track improvement over attempts

### 3. Writing Module
**Purpose**: Develop Devanagari script writing skills through guided practice.

#### 3.1 Character Tracing
**Component Specifications**:

**WritingCharacter**:
```javascript
writingCharacters/{characterId}
{
  character: "न",
  type: "consonant",
  transliteration: "na",
  strokeData: [
    {
      strokeOrder: 1,
      points: [
        { x: 10, y: 20 },
        { x: 15, y: 25 },
        { x: 20, y: 30 },
        // ... more points
      ],
      direction: "left-to-right"
    },
    {
      strokeOrder: 2,
      points: [
        { x: 25, y: 15 },
        { x: 30, y: 20 },
        { x: 35, y: 25 },
        // ... more points
      ],
      direction: "top-to-bottom"
    }
  ],
  audioUrl: "https://storage.googleapis.com/audio/na.mp3",
  lessonId: "lesson_2",
  level: "beginner",
  orderIndex: 1,
  examples: ["नमस्कार", "नदी", "नगर"]
}
```

**TracingCanvas**:
- **Stroke Animation**: Animated demonstration of correct stroke order
- **Drawing Area**: Canvas for user to trace character
- **Real-time Feedback**: Green overlay for correct strokes, red for incorrect
- **Stroke Order Detection**: Detect and penalize incorrect stroke order
- **Undo/Clear**: Drawing controls for correction
- **Score Calculation**: Accuracy based on path similarity and stroke order

**Scoring Algorithm**:
```javascript
function scoreHandwriting(userStrokes, referenceStrokes) {
  let totalScore = 0;
  let strokeOrderPenalty = 0;
  
  // Check stroke order
  for (let i = 0; i < userStrokes.length; i++) {
    if (userStrokes[i].order !== referenceStrokes[i].strokeOrder) {
      strokeOrderPenalty += 20;
    }
  }
  
  // Score each stroke using Dynamic Time Warping
  for (let i = 0; i < userStrokes.length; i++) {
    const userStroke = userStrokes[i].points;
    const referenceStroke = referenceStrokes[i].points;
    
    const dtwScore = dynamicTimeWarping(userStroke, referenceStroke);
    totalScore += dtwScore;
  }
  
  // Average stroke score
  const averageStrokeScore = totalScore / userStrokes.length;
  
  // Apply stroke order penalty
  const finalScore = Math.max(0, averageStrokeScore - strokeOrderPenalty);
  
  return {
    score: finalScore,
    strokeOrderCorrect: strokeOrderPenalty === 0,
    strokeScores: strokeScores,
    feedback: generateWritingFeedback(finalScore, strokeOrderPenalty)
  };
}

function dynamicTimeWarping(sequence1, sequence2) {
  // Implement DTW algorithm for path similarity
  const n = sequence1.length;
  const m = sequence2.length;
  const dtw = Array(n + 1).fill().map(() => Array(m + 1).fill(Infinity));
  
  dtw[0][0] = 0;
  
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = euclideanDistance(sequence1[i - 1], sequence2[j - 1]);
      dtw[i][j] = cost + Math.min(
        dtw[i - 1][j],    // insertion
        dtw[i][j - 1],    // deletion
        dtw[i - 1][j - 1] // match
      );
    }
  }
  
  // Normalize and convert to percentage
  const maxDistance = Math.max(n, m) * 100; // Assuming max distance of 100 per point
  const similarity = (1 - dtw[n][m] / maxDistance) * 100;
  
  return Math.max(0, Math.min(100, similarity));
}
```

#### 3.2 Word and Sentence Writing
**Purpose**: Progress from individual characters to words and sentences.

**WritingExercise**:
```javascript
writingExercises/{exerciseId}
{
  lessonId: "lesson_3",
  type: "word",
  targetWord: "मराठी",
  transliteration: "Marāṭhī",
  englishMeaning: "Marathi",
  audioUrl: "https://storage.googleapis.com/audio/marathi.mp3",
  hint: "Start with 'म', then 'र', then 'ा', then 'ट', then 'ी'",
  difficulty: "intermediate",
  xpReward: 20
}
```

**DictationMode**:
- **Audio Playback**: Listen to word or sentence
- **Writing Canvas**: Write what you hear
- **Character Recognition**: Verify written characters
- **Spelling Check**: Validate correct spelling
- **Progressive Difficulty**: Characters → Words → Sentences

### 4. Reading Module
**Purpose**: Develop reading comprehension and fluency through graded content.

#### 4.1 Graded Passages
**Component Specifications**:

**ReadingPassage**:
```javascript
readingPassages/{passageId}
{
  title: "A Day in Mumbai",
  titleMarathi: "मुंबईतील एक दिवस",
  lessonId: "lesson_4",
  level: "beginner",
  type: "paragraph",
  contentMarathi: "मुंबई हा एक मोठा शहर आहे. येथे अनेक लोक राहतात. मुंबईत बरेच इमारती आहेत.",
  contentTransliteration: "Mumbaī hā ek mōṭhā śahar āhe. Yēthē anēk lōk rāhatāt. Mumbaīt barēc imārtī āhēt.",
  contentEnglish: "Mumbai is a big city. Many people live here. There are many buildings in Mumbai.",
  audioUrl: "https://storage.googleapis.com/audio/passage_1.mp3",
  wordCount: 15,
  estimatedMinutes: 2,
  difficulty: "easy",
  vocabulary: ["vocab_1", "vocab_2", "vocab_3"],
  comprehensionQuestions: ["question_1", "question_2"]
}
```

**ReadingVocabulary**:
```javascript
readingPassages/{passageId}/vocabulary/{vocabId}
{
  wordMarathi: "शहर",
  transliteration: "śahar",
  meaningEnglish: "city",
  audioUrl: "https://storage.googleapis.com/audio/shahar.mp3",
  positionInText: 5,
  examples: [
    "मुंबई हा एक मोठा शहर आहे.",
    "पुणे हे एक सुंदर शहर आहे."
  ],
  difficulty: "easy"
}
```

**ReadingScreen**:
- **Text Display**: Marathi text with proper formatting
- **Tap-to-Define**: Tap any word to see meaning and hear pronunciation
- **Audio Playback**: Native speaker reads passage
- **Read-Aloud Mode**: User reads passage, app evaluates pronunciation
- **Comprehension Quiz**: Questions after reading
- **Progress Tracking**: Words read, comprehension score, reading speed

#### 4.2 Reading Comprehension
**Question Types**:

**MultipleChoice**:
```javascript
comprehensionQuestions/{questionId}
{
  passageId: "passage_1",
  type: "multiple_choice",
  questionText: "What is Mumbai described as in the passage?",
  questionMarathi: "धड्यात मुंबईचे वर्णन कसे केले आहे?",
  options: [
    "एक लहान गाव", // "A small village"
    "एक मोठा शहर", // "A big city"
    "एक सुंदर बाग", // "A beautiful garden"
    "एक जुना किल्ला"  // "An old fort"
  ],
  correctAnswer: "एक मोठा शहर",
  orderIndex: 1
}
```

**TrueFalse**:
```javascript
{
  type: "true_false",
  questionText: "Mumbai has many buildings.",
  questionMarathi: "मुंबईत बरेच इमारती आहेत.",
  correctAnswer: true,
  orderIndex: 2
}
```

**ShortAnswer**:
```javascript
{
  type: "short_answer",
  questionText: "What do many people do in Mumbai?",
  questionMarathi: "मुंबईत अनेक लोक काय करतात?",
  correctAnswer: "राहतात", // "live"
  orderIndex: 3
}
```

### 5. Mini-Games
**Purpose**: Reinforce learning through fun, gamified activities.

#### 5.1 Word Scramble
**Gameplay**:
- Display scrambled Devanagari characters
- User rearranges to form correct word
- Timer and score tracking
- Progressive difficulty

**GameConfig**:
```javascript
{
  type: "word_scramble",
  lessonId: "lesson_2",
  level: "beginner",
  words: ["नमस्कार", "धन्यवाद", "शुभकामना"],
  timeLimit: 60, // seconds
  xpReward: 25,
  config: {
    scrambleType: "character",
    hintsAvailable: 3,
    pointsPerWord: 10,
    timeBonus: 5
  }
}
```

#### 5.2 Phrase Builder
**Gameplay**:
- Display mixed Marathi words
- User arranges into correct sentence
- Drag and drop interface
- Grammar and syntax feedback

#### 5.3 Audio Matching
**Gameplay**:
- Play audio clip
- User selects matching written phrase
- Multiple choice format
- Pronunciation practice

#### 5.4 Rapid-Fire Translation
**Gameplay**:
- Display English phrase
- User types or speaks Marathi translation
- 60-second time limit
- Speed and accuracy scoring

#### 5.5 Reading Speed Race
**Gameplay**:
- Display passage
- User reads as fast as possible
- Comprehension check after reading
- WPM calculation and tracking

#### 5.6 Character Tracing Race
**Gameplay**:
- Display character to trace
- Time limit for accurate tracing
- Speed and accuracy competition
- Progressive character difficulty

### 6. Quiz System
**Purpose**: Assess learning and provide feedback.

**QuizStructure**:
```javascript
lessons/{lessonId}/quizQuestions/{questionId}
{
  type: "multiple_choice", // or "fill_blank", "match_pair", "speak_answer"
  questionText: "How do you say 'Hello' in Marathi?",
  questionMarathi: "मराठीत 'Hello' कसे म्हणाल?",
  options: [
    "धन्यवाद",
    "नमस्कार",
    "शुभकामना",
    "कशी आहात?"
  ],
  correctAnswer: "नमस्कार",
  audioUrl: "https://storage.googleapis.com/audio/question_1.mp3",
  orderIndex: 1,
  xpReward: 10,
  timeLimit: 30 // seconds
}
```

**QuizFlow**:
1. **Question Display**: Show question with options
2. **User Response**: Select or input answer
3. **Immediate Feedback**: Show correct/incorrect with explanation
4. **Score Update**: Update running score
5. **Progress Tracking**: Show question progress
6. **Final Results**: Summary with XP award

**Scoring**:
```javascript
function calculateQuizScore(attempts, timeTaken, timeLimit) {
  let baseScore = 100;
  
  // Penalty for incorrect attempts
  const attemptPenalty = (attempts - 1) * 20;
  baseScore -= attemptPenalty;
  
  // Time bonus
  const timeBonus = Math.max(0, (timeLimit - timeTaken) / timeLimit * 20);
  baseScore += timeBonus;
  
  return Math.max(0, Math.min(100, baseScore));
}
```

## Progress Tracking

### User Progress
```javascript
users/{userId}/progress/{progressId}
{
  lessonId: "lesson_1",
  status: "completed",
  score: 85,
  completedAt: timestamp,
  xpEarned: 50,
  timeSpent: 720, // seconds
  attempts: 1,
  skillBreakdown: {
    speaking: {
      score: 90,
      attempts: 3
    },
    writing: {
      score: 80,
      attempts: 2
    },
    reading: {
      score: 85,
      attempts: 1
    }
  }
}
```

### Skill Mastery
```javascript
users/{userId}/skillMastery
{
  speaking: {
    totalAttempts: 45,
    averageScore: 82,
    masteredPhrases: ["phrase_1", "phrase_2", "phrase_3"],
    currentLevel: "intermediate"
  },
  writing: {
    totalAttempts: 30,
    averageScore: 75,
    masteredCharacters: ["char_1", "char_2", "char_3"],
    currentLevel: "beginner"
  },
  reading: {
    totalAttempts: 25,
    averageScore: 88,
    completedPassages: ["passage_1", "passage_2"],
    averageWpm: 35,
    currentLevel: "intermediate"
  }
}
```

## UI/UX Specifications

### Color Scheme
- **Speaking**: #4CAF50 (Green)
- **Writing**: #2196F3 (Blue)
- **Reading**: #FF9800 (Orange)
- **Quiz**: #9C27B0 (Purple)
- **Success**: #4CAF50
- **Error**: #F44336

### Typography
- **Marathi Text**: 'Noto Sans Devanagari', 18-24px
- **Transliteration**: 'Open Sans', italic, 16-18px
- **English**: 'Open Sans', regular, 16-18px
- **Headings**: 'Poppins', bold, 20-28px

### Animations
- **Card Flip**: 300ms ease-in-out
- **Progress Bar**: 500ms ease-out
- **Score Display**: 200ms bounce
- **Success Celebration**: 1000ms confetti
- **Error Shake**: 300ms shake

### Accessibility
- **Screen Reader**: Full content description
- **Keyboard Navigation**: Complete keyboard support
- **Color Contrast**: WCAG AA compliant
- **Touch Targets**: Minimum 44x44px
- **Audio Descriptions**: Alternative text for audio content

## Technical Implementation

### Firebase Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Lessons - public read
    match /lessons/{lessonId} {
      allow read: if true;
      allow write: if false;
    }
    
    // User progress - user read/write
    match /users/{userId}/progress/{progressId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Phrases - public read
    match /phrases/{phraseId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

### Performance Optimization
- **Audio Preloading**: Cache lesson audio files
- **Image Optimization**: WebP format with fallbacks
- **Lazy Loading**: Load content on demand
- **Debounced Scoring**: Throttle pronunciation scoring
- **Local Caching**: Store progress locally

### Error Handling
- **Audio Errors**: Show retry option, fallback to text
- **Network Issues**: Offline mode with cached content
- **Scoring Failures**: Default score, log error
- **Data Corruption**: Validate and reset if needed

## Testing Requirements

### Unit Tests
- Pronunciation scoring algorithm
- Handwriting recognition (DTW)
- Quiz score calculation
- Progress tracking logic

### Integration Tests
- Firebase Cloud Functions integration
- OpenAI Whisper API calls
- Audio recording and playback
- Canvas drawing and scoring

### E2E Tests
- Complete lesson flow
- All skill modules
- Quiz completion
- Progress updates

### Performance Tests
- Audio load time: < 1 second
- Scoring latency: < 2 seconds
- Canvas rendering: 60fps
- Memory usage: < 150MB

## Success Metrics

### Learning Outcomes
- Average lesson completion rate: > 75%
- Speaking accuracy improvement: > 20%
- Writing mastery rate: > 60%
- Reading comprehension: > 70%

### User Engagement
- Average time per lesson: 12-15 minutes
- Lesson retry rate: < 30%
- Skill practice frequency: > 3 times/week
- Quiz completion rate: > 85%

### Technical Performance
- Lesson load time: < 3 seconds
- Audio playback latency: < 500ms
- Scoring accuracy: > 90%
- Crash rate: < 0.1%

## Future Enhancements

### Advanced Features
- AI-powered personalized learning paths
- Voice conversation practice with chatbots
- Advanced handwriting recognition
- Real-time reading fluency coaching

### Content Expansion
- More lesson topics and levels
- Regional dialect variations
- Professional vocabulary modules
- Cultural immersion content

### Social Features
- Peer learning groups
- Speaking practice partners
- Progress sharing and comparison
- Collaborative learning activities
