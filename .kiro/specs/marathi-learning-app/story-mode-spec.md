> **Migration Notice**: This spec was written for the original Firebase/Firestore architecture. The app has been fully migrated to **Supabase PostgreSQL + Vercel Serverless Functions**. All Firebase/Firestore references in code examples below are superseded by the implementation in `api/` and `supabase/migrations/`. Refer to `design.md` and `tasks.md` for the current architecture.

---

# Story Mode Specification

## Overview
Story Mode transforms language learning into an immersive narrative experience where users help characters navigate real-world Marathi scenarios. This system integrates speaking, reading, and writing skills into cohesive, branching storylines that provide context and motivation for language acquisition.

## Core Concepts

### 1. Narrative Structure
**Purpose**: Create engaging, contextual learning experiences through storytelling.

#### 1.1 Story Chapters
```javascript
storyChapters/{chapterId}
{
  title: "The Market Adventure",
  titleMarathi: "बाजारातील साहस",
  description: "Help Priya navigate the local market and buy ingredients for a special meal",
  orderIndex: 1,
  characterName: "Priya",
  characterMarathiName: "प्रिया",
  characterImageUrl: "https://storage.googleapis.com/characters/priya.png",
  characterDescription: "A young woman learning to cook traditional Maharashtrian dishes",
  requiredLevel: 2,
  estimatedMinutes: 20,
  totalScenes: 5,
  xpReward: 100,
  unlocks: {
    nextChapter: "chapter_2",
    badges: ["badge_market_master"],
    vocabulary: ["vocab_1", "vocab_2", "vocab_3"]
  },
  tags: ["market", "shopping", "food", "daily_life"],
  difficulty: "beginner",
  createdAt: timestamp
}
```

#### 1.2 Story Scenes
```javascript
storyChapters/{chapterId}/scenes/{sceneId}
{
  orderIndex: 1,
  sceneType: "dialogue", // "dialogue" | "read_sign" | "write_note" | "mixed"
  narrativeText: "Priya arrives at the bustling market. She needs to buy vegetables for dinner.",
  narrativeMarathi: "प्रिया गजबजलेल्या बाजारात पोहोचते. तिला डिनरसाठी भाज्या खरेदी करायच्या आहेत.",
  characterImageUrl: "https://storage.googleapis.com/scenes/market_1.png",
  backgroundMusicUrl: "https://storage.googleapis.com/audio/market_ambience.mp3",
  
  // Dialogue-specific fields
  dialogueOptions: [
    {
      id: "option_1",
      marathiText: "नमस्कार, काय आहे?",
      transliteration: "Namaskār, kāy āhe?",
      englishMeaning: "Hello, how are you?",
      audioUrl: "https://storage.googleapis.com/audio/namaskar_kay_ahe.mp3",
      isCorrect: true,
      feedback: "Great! That's a polite greeting.",
      nextSceneId: "scene_2"
    },
    {
      id: "option_2",
      marathiText: "भाज्या किती आहेत?",
      transliteration: "Bhājyā kitī āhet?",
      englishMeaning: "How much are the vegetables?",
      audioUrl: "https://storage.googleapis.com/audio/bhajya_kiti_ahe.mp3",
      isCorrect: false,
      feedback: "That's good, but let's start with a greeting first.",
      nextSceneId: "scene_1_retry"
    }
  ],
  
  // Reading-specific fields
  readingContent: {
    marathiText: "ताजी भाज्या विक्रीसाठी उपलब्ध आहेत",
    transliteration: "Tājī bhājyā vikrīsāṭhī upalabdh āhet",
    englishMeaning: "Fresh vegetables are available for sale",
    imageUrl: "https://storage.googleapis.com/scenes/market_sign.jpg",
    comprehensionQuestion: {
      question: "What is available for sale?",
      options: ["Fresh vegetables", "Fruits", "Both vegetables and fruits", "None"],
      correctAnswer: "Fresh vegetables"
    }
  },
  
  // Writing-specific fields
  writingPrompt: {
    targetWord: "टोमॅटो",
    transliteration: "ṭomāṭo",
    englishMeaning: "tomato",
    audioUrl: "https://storage.googleapis.com/audio/tomato.mp3",
    hint: "Start with 'ट', then 'ो', then 'म', then 'ॅ', then 'ट', then 'ो'",
    difficulty: "intermediate"
  },
  
  // Mixed scene fields
  mixedContent: {
    dialogue: {
      character: "Shopkeeper",
      marathiText: "काय घ्याल?",
      transliteration: "Kāy ghyāl?",
      englishMeaning: "What would you like?"
    },
    reading: {
      signText: "टोमॅटो - ₹40/किलो",
      transliteration: "Ṭomāṭo - ₹40/kīlo"
    },
    writing: {
      prompt: "Write 'टोमॅटो' (tomato)"
    }
  },
  
  xpReward: 20,
  completionCriteria: {
    type: "dialogue_choice", // or "reading_comprehension", "writing_accuracy", "mixed_success"
    requiredScore: 70
  },
  hints: [
    "Start with a polite greeting",
    "Use the formal 'आपण' (you) form",
    "Remember to say 'please' and 'thank you'"
  ],
  vocabulary: [
    {
      marathi: "बाजार",
      transliteration: "bājār",
      english: "market"
    },
    {
      marathi: "भाज्या",
      transliteration: "bhājyā",
      english: "vegetables"
    }
  ]
}
```

### 2. Scene Types and Mechanics

#### 2.1 Dialogue Scenes
**Purpose**: Practice speaking and conversational skills.

**Flow**:
1. **Narrative Setup**: Display context and character dialogue
2. **User Response**: Present multiple dialogue options
3. **Selection**: User chooses their response
4. **Evaluation**: Check if response is appropriate
5. **Feedback**: Provide immediate feedback on choice
6. **Progression**: Move to next scene based on choice

**Scoring Algorithm**:
```javascript
function evaluateDialogueChoice(userChoice, correctChoice) {
  let score = 0;
  let feedback = "";
  
  if (userChoice.isCorrect) {
    score = 100;
    feedback = userChoice.feedback || "Perfect choice!";
  } else {
    // Partial credit for culturally appropriate responses
    if (isCulturallyAppropriate(userChoice)) {
      score = 50;
      feedback = "Good attempt! " + userChoice.feedback;
    } else {
      score = 0;
      feedback = "Try again! " + userChoice.feedback;
    }
  }
  
  return {
    score,
    feedback,
    nextSceneId: userChoice.nextSceneId,
    xpEarned: Math.floor(score / 5) // 20 XP max
  };
}

function isCulturallyAppropriate(choice) {
  // Check if the choice follows cultural norms
  const culturalMarkers = [
    'नमस्कार', // greeting
    'धन्यवाद', // thank you
    'कृपया',   // please
    'आपण'     // formal you
  ];
  
  return culturalMarkers.some(marker => 
    choice.marathiText.includes(marker)
  );
}
```

#### 2.2 Reading Scenes
**Purpose**: Develop reading comprehension and contextual understanding.

**Flow**:
1. **Content Display**: Show sign, letter, or menu in Marathi
2. **Reading Time**: Allow user to read and understand
3. **Comprehension Check**: Ask questions about the content
4. **Answer Evaluation**: Check understanding
5. **Vocabulary Highlight**: Tap-to-define for difficult words
6. **Progression**: Move to next scene

**Scoring Algorithm**:
```javascript
function evaluateReadingComprehension(userAnswer, correctAnswer, readingTime) {
  let score = 0;
  
  // Check answer correctness
  if (userAnswer === correctAnswer) {
    score = 100;
  } else if (isPartialMatch(userAnswer, correctAnswer)) {
    score = 50;
  }
  
  // Time bonus (faster reading = better comprehension)
  const timeBonus = calculateTimeBonus(readingTime);
  score = Math.min(100, score + timeBonus);
  
  return {
    score,
    feedback: generateReadingFeedback(score),
    xpEarned: Math.floor(score / 5)
  };
}

function calculateTimeBonus(readingTime) {
  // Optimal reading time: 30-60 seconds
  if (readingTime < 30) return 10; // Too fast, might be guessing
  if (readingTime <= 60) return 20; // Good pace
  if (readingTime <= 90) return 10; // Acceptable
  return 0; // Too slow
}
```

#### 2.3 Writing Scenes
**Purpose**: Practice Devanagari script writing in context.

**Flow**:
1. **Prompt Display**: Show word or phrase to write
2. **Audio Playback**: Play pronunciation
3. **Writing Canvas**: User writes on canvas
4. **Stroke Evaluation**: Check stroke order and accuracy
5. **Character Recognition**: Verify written characters
6. **Feedback**: Provide specific improvement suggestions
7. **Progression**: Move to next scene

**Scoring Algorithm**:
```javascript
async function evaluateWritingAttempt(userStrokes, targetWord, referenceStrokes) {
  // Segment user input into characters
  const userCharacters = segmentIntoCharacters(userStrokes);
  
  let totalScore = 0;
  const characterScores = [];
  
  for (let i = 0; i < userCharacters.length; i++) {
    const userChar = userCharacters[i];
    const targetChar = targetWord[i];
    const referenceChar = referenceStrokes[targetChar];
    
    // Score each character
    const charScore = await scoreCharacter(userChar, referenceChar);
    characterScores.push({
      character: targetChar,
      score: charScore
    });
    
    totalScore += charScore;
  }
  
  // Average score
  const averageScore = totalScore / userCharacters.length;
  
  return {
    score: averageScore,
    characterScores,
    feedback: generateWritingFeedback(averageScore, characterScores),
    xpEarned: Math.floor(averageScore / 5)
  };
}

async function scoreCharacter(userStrokes, referenceStrokes) {
  // Use DTW for stroke comparison
  const strokeScore = dynamicTimeWarping(userStrokes, referenceStrokes);
  
  // Check stroke order
  const orderScore = checkStrokeOrder(userStrokes, referenceStrokes);
  
  // Combined score
  const finalScore = (strokeScore * 0.7) + (orderScore * 0.3);
  
  return Math.min(100, Math.max(0, finalScore));
}
```

#### 2.4 Mixed Scenes
**Purpose**: Integrate multiple skills in complex scenarios.

**Flow**:
1. **Context Setup**: Present complex scenario
2. **Multi-Task Challenge**: 
   - Speaking: Respond to character dialogue
   - Reading: Understand signs or written information
   - Writing: Complete written task
3. **Integrated Evaluation**: Score all components
4. **Comprehensive Feedback**: Provide holistic feedback
5. **Progression**: Move to next scene based on overall performance

**Scoring Algorithm**:
```javascript
function evaluateMixedScene(userResponses, sceneRequirements) {
  const scores = {
    dialogue: 0,
    reading: 0,
    writing: 0
  };
  
  // Evaluate each component
  if (userResponses.dialogue) {
    scores.dialogue = evaluateDialogueChoice(
      userResponses.dialogue,
      sceneRequirements.dialogue.correctChoice
    ).score;
  }
  
  if (userResponses.reading) {
    scores.reading = evaluateReadingComprehension(
      userResponses.reading.answer,
      sceneRequirements.reading.correctAnswer,
      userResponses.reading.time
    ).score;
  }
  
  if (userResponses.writing) {
    scores.writing = (await evaluateWritingAttempt(
      userResponses.writing.strokes,
      sceneRequirements.writing.targetWord,
      sceneRequirements.writing.referenceStrokes
    )).score;
  }
  
  // Calculate weighted average
  const weights = {
    dialogue: 0.4,
    reading: 0.3,
    writing: 0.3
  };
  
  const overallScore = 
    (scores.dialogue * weights.dialogue) +
    (scores.reading * weights.reading) +
    (scores.writing * weights.writing);
  
  return {
    overallScore,
    componentScores: scores,
    feedback: generateMixedFeedback(overallScore, scores),
    xpEarned: Math.floor(overallScore / 5)
  };
}
```

### 3. Branching Narrative System
**Purpose**: Create non-linear story paths based on user choices.

#### 3.1 Decision Tree Structure
```javascript
const STORY_BRANCHES = {
  chapter_1: {
    scene_1: {
      options: {
        option_1: { nextScene: "scene_2a", path: "polite" },
        option_2: { nextScene: "scene_2b", path: "direct" },
        option_3: { nextScene: "scene_2c", path: "casual" }
      }
    },
    scene_2a: {
      path: "polite",
      options: {
        option_1: { nextScene: "scene_3", outcome: "success" },
        option_2: { nextScene: "scene_4", outcome: "challenge" }
      }
    },
    // ... more scenes
  }
};
```

#### 3.2 Path Tracking
```javascript
async function trackStoryPath(userId, chapterId, sceneId, choiceId) {
  const db = getFirestore();
  
  // Get user's story progress
  const userRef = db.collection('users').doc(userId);
  const progressRef = userRef.collection('storyProgress').doc(chapterId);
  
  const progressDoc = await progressRef.get();
  const progressData = progressDoc.exists ? progressDoc.data() : {
    currentSceneId: null,
    completedScenes: [],
    pathTaken: [],
    choices: {},
    totalScore: 0,
    attempts: 0
  };
  
  // Update progress
  progressData.currentSceneId = sceneId;
  progressData.choices[sceneId] = choiceId;
  progressData.pathTaken.push(choiceId);
  
  if (!progressData.completedScenes.includes(sceneId)) {
    progressData.completedScenes.push(sceneId);
  }
  
  progressData.attempts++;
  
  await progressRef.set(progressData);
  
  return progressData;
}
```

#### 3.3 Alternative Endings
```javascript
const CHAPTER_OUTCOMES = {
  chapter_1: {
    perfect: {
      title: "Market Master",
      description: "You navigated the market perfectly!",
      xpBonus: 50,
      badge: "badge_market_master"
    },
    good: {
      title: "Successful Shopper",
      description: "You completed your shopping trip!",
      xpBonus: 30,
      badge: "badge_successful_shopper"
    },
    needs_practice: {
      title: "Learning Shopper",
      description: "Keep practicing your Marathi!",
      xpBonus: 10,
      badge: null
    }
  }
};

function determineChapterOutcome(progressData) {
  const averageScore = progressData.totalScore / progressData.completedScenes.length;
  
  if (averageScore >= 90) {
    return CHAPTER_OUTCOMES.chapter_1.perfect;
  } else if (averageScore >= 70) {
    return CHAPTER_OUTCOMES.chapter_1.good;
  } else {
    return CHAPTER_OUTCOMES.chapter_1.needs_practice;
  }
}
```

### 4. Character System
**Purpose**: Create relatable characters that guide users through stories.

#### 4.1 Character Profiles
```javascript
const CHARACTERS = {
  priya: {
    name: "Priya",
    marathiName: "प्रिया",
    age: 22,
    occupation: "Student",
    personality: "Curious and friendly",
    background: "A college student learning to cook traditional Maharashtrian dishes",
    avatarUrl: "https://storage.googleapis.com/characters/priya.png",
    voiceStyle: "friendly",
    catchphrases: [
      "चला, शिकूया!", // "Let's learn!"
      "अगदी छान!", // "Very good!"
      "पुन्हा प्रयत्न करूया." // "Let's try again."
    ]
  },
  raju: {
    name: "Raju",
    marathiName: "राजू",
    age: 35,
    occupation: "Shopkeeper",
    personality: "Helpful and patient",
    background: "Runs a local vegetable shop in the market",
    avatarUrl: "https://storage.googleapis.com/characters/raju.png",
    voiceStyle: "warm",
    catchphrases: [
      "स्वागत आहे!", // "Welcome!"
      "काय घ्याल?", // "What would you like?"
      "धन्यवाद!" // "Thank you!"
    ]
  }
};
```

#### 4.2 Character Dialogue System
```javascript
function generateCharacterDialogue(characterId, context, emotion = "neutral") {
  const character = CHARACTERS[characterId];
  
  const dialogueTemplates = {
    greeting: [
      "नमस्कार!",
      "नमस्कार, कसे आहात?",
      "स्वागत आहे!"
    ],
    encouragement: [
      "छान केले!",
      "अगदी छान!",
      "चालू ठेवा!"
    ],
    correction: [
      "थोडक्यात विचार करूया.",
      "पुन्हा प्रयत्न करूया.",
      "जवळचे आहे!"
    ],
    farewell: [
      "धन्यवाद!",
      "भेट झाला, धन्यवाद!",
      "पुन्हा भेटू!"
    ]
  };
  
  const templates = dialogueTemplates[context] || dialogueTemplates.greeting;
  const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
  
  return {
    character: character.name,
    marathiText: selectedTemplate,
    emotion,
    voiceStyle: character.voiceStyle
  };
}
```

### 5. Progress and Achievement System
**Purpose**: Track story completion and reward progress.

#### 5.1 Chapter Completion
```javascript
async function completeChapter(userId, chapterId, progressData) {
  const db = getFirestore();
  const userRef = db.collection('users').doc(userId);
  
  // Determine outcome
  const outcome = determineChapterOutcome(progressData);
  
  // Update progress
  await userRef.collection('storyProgress').doc(chapterId).update({
    status: "completed",
    completedAt: FieldValue.serverTimestamp(),
    outcome: outcome.title,
    totalScore: progressData.totalScore,
    attempts: progressData.attempts
  });
  
  // Award XP
  await awardXP(userId, 'story_completion', chapterId, {
    chapterTitle: outcome.title,
    xpReward: outcome.xpBonus
  });
  
  // Award badge if applicable
  if (outcome.badge) {
    await awardBadge(userId, outcome.badge);
  }
  
  // Unlock next chapter if available
  if (outcome.nextChapter) {
    await unlockChapter(userId, outcome.nextChapter);
  }
  
  return {
    completed: true,
    outcome,
    xpEarned: outcome.xpBonus,
    badgeAwarded: outcome.badge
  };
}
```

#### 5.2 Story Statistics
```javascript
async function getStoryStatistics(userId) {
  const db = getFirestore();
  
  // Get all story progress
  const progressSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('storyProgress')
    .get();
  
  const stats = {
    totalChapters: 0,
    completedChapters: 0,
    inProgressChapters: 0,
    totalScenes: 0,
    completedScenes: 0,
    averageScore: 0,
    totalXP: 0,
    badgesEarned: [],
    favoriteCharacters: {},
    timeSpent: 0
  };
  
  progressSnapshot.forEach(doc => {
    const progress = doc.data();
    stats.totalChapters++;
    
    if (progress.status === 'completed') {
      stats.completedChapters++;
      stats.totalXP += progress.xpEarned || 0;
      stats.averageScore += progress.totalScore || 0;
    } else if (progress.status === 'in_progress') {
      stats.inProgressChapters++;
    }
    
    stats.completedScenes += progress.completedScenes?.length || 0;
  });
  
  // Calculate averages
  if (stats.completedChapters > 0) {
    stats.averageScore = stats.averageScore / stats.completedChapters;
  }
  
  return stats;
}
```

### 6. UI/UX Specifications

#### 6.1 Story Selection Screen
**Components**:
- **Chapter Cards**: Display chapter title, description, character preview
- **Progress Indicators**: Show completion status and score
- **Lock System**: Gray out locked chapters with level requirements
- **Character Preview**: Show main character for each chapter
- **Difficulty Tags**: Color-coded difficulty indicators
- **XP Rewards**: Display potential XP earnings

#### 6.2 Scene Screen
**Layout**:
- **Header**: Chapter progress and scene number
- **Narrative Area**: Story text with character dialogue
- **Visual Area**: Character illustrations and scene backgrounds
- **Interaction Area**: Response options, writing canvas, or reading content
- **Feedback Area**: Score display and feedback messages
- **Navigation**: Previous/Next scene buttons, hints

#### 6.3 Dialogue Interface
**Elements**:
- **Character Portrait**: Animated character speaking
- **Speech Bubble**: Character dialogue with text
- **Response Options**: Multiple choice buttons with Marathi text
- **Audio Playback**: Native pronunciation for each option
- **Transliteration**: Roman script display
- **English Translation**: Hidden by default, toggleable

#### 6.4 Reading Interface
**Components**:
- **Content Display**: Marathi text with proper formatting
- **Visual Context**: Image of sign, letter, or menu
- **Vocabulary Highlights**: Tap-to-define for difficult words
- **Comprehension Questions**: Multiple choice or true/false
- **Timer**: Reading time tracking
- **Progress Bar**: Reading progress indicator

#### 6.5 Writing Interface
**Elements**:
- **Prompt Display**: Target word or phrase with audio
- **Writing Canvas**: Large drawing area with guides
- **Stroke Animation**: Animated demonstration of correct strokes
- **Real-time Feedback**: Color-coded stroke accuracy
- **Character Recognition**: Live character verification
- **Undo/Clear Controls**: Drawing management tools

### 7. Technical Implementation

#### 7.1 Firebase Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Story chapters - public read
    match /storyChapters/{chapterId} {
      allow read: if true;
      allow write: if false; // Admin only
    }
    
    // Story scenes - public read
    match /storyChapters/{chapterId}/scenes/{sceneId} {
      allow read: if true;
      allow write: if false; // Admin only
    }
    
    // User story progress - user read/write
    match /users/{userId}/storyProgress/{chapterId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

#### 7.2 Performance Optimization
- **Asset Preloading**: Load chapter assets in advance
- **Scene Caching**: Cache completed scenes locally
- **Audio Streaming**: Stream audio files instead of full download
- **Image Optimization**: Use WebP format with fallbacks
- **Lazy Loading**: Load scenes on demand

#### 7.3 Offline Support
```javascript
// Cache chapter data for offline play
async function cacheChapterForOffline(chapterId) {
  const db = getFirestore();
  
  // Get chapter data
  const chapterDoc = await db.collection('storyChapters').doc(chapterId).get();
  const chapterData = chapterDoc.data();
  
  // Get all scenes
  const scenesSnapshot = await db
    .collection(`storyChapters/${chapterId}/scenes`)
    .get();
  
  const scenesData = scenesSnapshot.docs.map(doc => doc.data());
  
  // Cache locally
  await AsyncStorage.setItem(`cached_chapter_${chapterId}`, JSON.stringify({
    chapter: chapterData,
    scenes: scenesData
  }));
}
```

### 8. Testing Requirements

#### 8.1 Unit Tests
- Dialogue choice evaluation
- Reading comprehension scoring
- Writing accuracy calculation
- Branching logic validation

#### 8.2 Integration Tests
- Firebase Firestore operations
- Character dialogue generation
- Progress tracking system
- XP and badge awarding

#### 8.3 E2E Tests
- Complete chapter flow
- All scene types
- Branching scenarios
- Chapter completion

#### 8.4 Performance Tests
- Scene load time: < 2 seconds
- Dialogue response time: < 500ms
- Writing evaluation: < 1 second
- Asset loading: < 3 seconds

### 9. Success Metrics

#### 9.1 User Engagement
- Chapter completion rate: > 70%
- Average scenes per chapter: > 80%
- Story mode usage: > 60% of active users
- Replay rate: > 25%

#### 9.2 Learning Outcomes
- Dialogue accuracy improvement: > 25%
- Reading comprehension scores: > 75%
- Writing accuracy in context: > 70%
- Vocabulary retention: > 80%

#### 9.3 Technical Performance
- Scene transition time: < 1 second
- Asset loading reliability: > 99%
- Progress sync accuracy: > 99.9%
- System uptime: > 99.5%

### 10. Future Enhancements

#### 10.1 Advanced Features
- **Voice Acting**: Professional voice actors for characters
- **Animated Characters**: Full character animations and expressions
- **Branching Storylines**: Multiple story paths and endings
- **Character Relationships**: Build relationships with characters
- **Seasonal Stories**: Special holiday and event stories

#### 10.2 Content Expansion
- **More Chapters**: Additional story chapters and scenarios
- **Character Roster**: More diverse characters and personalities
- **Skill-Specific Stories**: Stories focusing on specific skills
- **Cultural Themes**: Stories exploring different cultural aspects
- **Difficulty Levels**: Stories for different proficiency levels

#### 10.3 Social Features
- **Cooperative Stories**: Multiplayer story experiences
- **Story Sharing**: Share story progress and achievements
- **Character Customization**: Customize story characters
- **Community Stories**: User-created story content
- **Story Clubs**: Groups for discussing stories

#### 10.4 Analytics and Personalization
- **Learning Path Analysis**: Track story-based learning patterns
- **Adaptive Difficulty**: Adjust story difficulty based on performance
- **Personalized Recommendations**: Suggest stories based on interests
- **Progress Insights**: Detailed learning analytics
- **Achievement Tracking**: Comprehensive achievement system
