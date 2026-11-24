> **Migration Notice**: This spec was written for the original Firebase/Firestore architecture. The app has been fully migrated to **Supabase PostgreSQL + Vercel Serverless Functions**. All Firebase/Firestore references in code examples below are superseded by the implementation in `api/` and `supabase/migrations/`. Refer to `design.md` and `tasks.md` for the current architecture.

---

# Cultural Trivia System Specification

## Overview
The Cultural Trivia System delivers engaging "Maharashtra Knowledge Drops" that provide cultural, historical, and linguistic context alongside language learning. This system transforms the app from a simple language tool into a comprehensive cultural education platform.

## Core Components

### 1. Fun Facts Database
**Purpose**: Store and organize cultural facts about Maharashtra and Marathi language.

#### 1.1 Fact Categories
```javascript
const FACT_CATEGORIES = {
  history: {
    name: "History",
    icon: "🏛️",
    color: "#8B4513",
    description: "Historical events, figures, and periods"
  },
  literature: {
    name: "Literature",
    icon: "📚",
    color: "#4A148C",
    description: "Marathi literature, poets, and literary works"
  },
  culture: {
    name: "Culture",
    icon: "🎭",
    color: "#C62828",
    description: "Traditions, customs, and cultural practices"
  },
  food: {
    name: "Food",
    icon: "🍛",
    color: "#FF6F00",
    description: "Maharashtrian cuisine and culinary traditions"
  },
  nature: {
    name: "Nature",
    icon: "🌿",
    color: "#2E7D32",
    description: "Geography, wildlife, and natural landmarks"
  },
  festivals: {
    name: "Festivals",
    icon: "🎉",
    color: "#E65100",
    description: "Festivals, celebrations, and religious events"
  }
};
```

#### 1.2 Fact Data Structure
```javascript
funFacts/{factId}
{
  category: "history",
  contentEnglish: "Shivaji Maharaj founded the Maratha Empire in 1674, establishing a sovereign Hindu kingdom in India.",
  contentMarathi: "शिवाजी महाराजांनी १६७४ मध्ये मराठा साम्राज्याची स्थापना केली आणि भारतात एक सार्वभौम हिंदू राज्य स्थापन केले.",
  contentTransliteration: "Śivājī Mahārājānī 1674 madhye Marāthā sāmrājyācī sthāpanā kelī āṇi Bhārāt ēk sārvabhauṃ Hindu rājya sthāpan kelē.",
  relatedVocabulary: [
    {
      marathi: "शिवाजी महाराज",
      transliteration: "Śivājī Mahārāj",
      english: "Shivaji Maharaj",
      audioUrl: "https://storage.googleapis.com/audio/shivaji_maharaj.mp3"
    },
    {
      marathi: "मराठा साम्राज्य",
      transliteration: "Marāthā sāmrājya",
      english: "Maratha Empire",
      audioUrl: "https://storage.googleapis.com/audio/maratha_samrajya.mp3"
    },
    {
      marathi: "राज्य",
      transliteration: "rājya",
      english: "kingdom/empire",
      audioUrl: "https://storage.googleapis.com/audio/rajya.mp3"
    }
  ],
  imageUrl: "https://storage.googleapis.com/images/shivaji_maharaj.jpg",
  source: "Historical Records",
  difficulty: "beginner",
  tags: ["maratha", "empire", "history", "shivaji"],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 2. Fact Delivery System
**Purpose**: Deliver facts at strategic moments to enhance learning without disrupting flow.

#### 2.1 Delivery Triggers
```javascript
const DELIVERY_TRIGGERS = {
  lessonComplete: {
    probability: 0.8, // 80% chance after lesson completion
    delay: 2000, // 2 seconds after completion
    animation: "slide_up"
  },
  quizComplete: {
    probability: 0.6, // 60% chance after quiz completion
    delay: 1500,
    animation: "fade_in"
  },
  checkpointReach: {
    probability: 1.0, // Always show at journey checkpoints
    delay: 0,
    animation: "celebration"
  },
  milestone: {
    probability: 1.0, // Always show at milestones
    delay: 0,
    animation: "spotlight"
  },
  daily: {
    probability: 1.0, // Always show daily fact
    time: "09:00", // 9 AM local time
    animation: "notification"
  }
};
```

#### 2.2 Fact Selection Algorithm
```javascript
async function selectFactForDelivery(userId, trigger, context = {}) {
  const db = getFirestore();
  
  // Get user's viewed facts
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();
  const userData = userDoc.data();
  const viewedFactIds = new Set(userData.viewedFacts || []);
  
  // Get available facts
  let factsQuery = db.collection('funFacts');
  
  // Filter by context if provided
  if (context.category) {
    factsQuery = factsQuery.where('category', '==', context.category);
  }
  
  if (context.difficulty) {
    factsQuery = factsQuery.where('difficulty', '==', context.difficulty);
  }
  
  const factsSnapshot = await factsQuery.get();
  const availableFacts = factsSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(fact => !viewedFactIds.has(fact.id));
  
  if (availableFacts.length === 0) {
    // All facts viewed, return random from all facts
    const allFactsSnapshot = await db.collection('funFacts').get();
    const allFacts = allFactsSnapshot.docs.map(doc => doc.data());
    return allFacts[Math.floor(Math.random() * allFacts.length)];
  }
  
  // Select fact based on trigger and context
  let selectedFact;
  
  switch (trigger) {
    case 'checkpointReach':
      // Select fact related to checkpoint location
      selectedFact = selectFactByContext(availableFacts, context);
      break;
    
    case 'lessonComplete':
      // Select fact related to lesson topic
      selectedFact = selectFactByTopic(availableFacts, context.topic);
      break;
    
    default:
      // Random selection
      selectedFact = availableFacts[Math.floor(Math.random() * availableFacts.length)];
  }
  
  return selectedFact;
}

function selectFactByContext(facts, context) {
  // Prioritize facts matching checkpoint context
  const contextualFacts = facts.filter(fact => 
    fact.tags && fact.tags.some(tag => context.tags?.includes(tag))
  );
  
  if (contextualFacts.length > 0) {
    return contextualFacts[Math.floor(Math.random() * contextualFacts.length)];
  }
  
  return facts[Math.floor(Math.random() * facts.length)];
}

function selectFactByTopic(facts, topic) {
  // Map lesson topics to fact categories
  const topicToCategory = {
    greetings: 'culture',
    family: 'culture',
    food: 'food',
    festivals: 'festivals',
    travel: 'nature',
    history: 'history'
  };
  
  const category = topicToCategory[topic] || 'culture';
  const categoryFacts = facts.filter(fact => fact.category === category);
  
  if (categoryFacts.length > 0) {
    return categoryFacts[Math.floor(Math.random() * categoryFacts.length)];
  }
  
  return facts[Math.floor(Math.random() * facts.length)];
}
```

### 3. Fact of the Day System
**Purpose**: Provide daily cultural content to encourage regular app engagement.

#### 3.1 Daily Fact Rotation
```javascript
async function getFactOfTheDay(date) {
  const db = getFirestore();
  const dateStr = date.toISOString().split('T')[0];
  
  // Check if fact of the day already exists
  const existingFact = await db
    .collection('factOfTheDay')
    .doc(dateStr)
    .get();
  
  if (existingFact.exists) {
    const factId = existingFact.data().factId;
    const factDoc = await db.collection('funFacts').doc(factId).get();
    return factDoc.data();
  }
  
  // Generate new fact of the day
  const allFacts = await db.collection('funFacts').get();
  const facts = allFacts.docs.map(doc => doc.data());
  
  // Use date-based selection for consistency
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  const factIndex = dayOfYear % facts.length;
  const selectedFact = facts[factIndex];
  
  // Store fact of the day
  await db.collection('factOfTheDay').doc(dateStr).set({
    factId: selectedFact.id || facts.findIndex(f => f === selectedFact),
    date: dateStr,
    createdAt: FieldValue.serverTimestamp()
  });
  
  return selectedFact;
}

// Scheduled function to generate fact of the day
exports.generateFactOfTheDay = functions.pubsub
  .schedule('0 9 * * *') // Every day at 9 AM
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    const today = new Date();
    await getFactOfTheDay(today);
    console.log('Fact of the day generated');
  });
```

#### 3.2 Contextual Fact Selection
```javascript
async function getContextualFactOfTheDay(date) {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  
  // Festival-based selection
  const festivalFacts = {
    '1-14': 'makar_sankranti', // January 14
    '3-25': 'gudi_padwa', // March 25 (approximate)
    '8-15': 'independence_day', // August 15
    '9-10': 'ganesh_chaturthi', // September 10 (approximate)
    '10-24': 'diwali', // October 24 (approximate)
  };
  
  const festivalKey = `${month}-${day}`;
  if (festivalFacts[festivalKey]) {
    return getFactByTag(festivalFacts[festivalKey]);
  }
  
  // Season-based selection
  const season = getSeason(month);
  return getFactByCategory(getSeasonCategory(season));
}

function getSeason(month) {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

function getSeasonCategory(season) {
  const seasonCategories = {
    spring: 'festivals',
    summer: 'nature',
    autumn: 'festivals',
    winter: 'culture'
  };
  return seasonCategories[season];
}
```

### 4. User Favorites System
**Purpose**: Allow users to save and revisit interesting facts.

#### 4.1 Favorite Management
```javascript
async function addToFavorites(userId, factId) {
  const db = getFirestore();
  const userRef = db.collection('users').doc(userId);
  
  // Check if already favorited
  const existingFavorite = await userRef
    .collection('favoriteFacts')
    .doc(factId)
    .get();
  
  if (existingFavorite.exists) {
    return { alreadyFavorited: true };
  }
  
  // Add to favorites
  await userRef.collection('favoriteFacts').doc(factId).set({
    factId,
    savedAt: FieldValue.serverTimestamp()
  });
  
  // Award small XP for engagement
  await awardXP(userId, 'fact_engagement', factId, { 
    action: 'favorite',
    xpReward: 5 
  });
  
  return { favorited: true };
}

async function removeFromFavorites(userId, factId) {
  const db = getFirestore();
  
  await db
    .collection('users')
    .doc(userId)
    .collection('favoriteFacts')
    .doc(factId)
    .delete();
  
  return { removed: true };
}

async function getUserFavorites(userId) {
  const db = getFirestore();
  
  const favoritesSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('favoriteFacts')
    .orderBy('savedAt', 'desc')
    .get();
  
  const favoriteFacts = [];
  for (const favoriteDoc of favoritesSnapshot.docs) {
    const factId = favoriteDoc.data().factId;
    const factDoc = await db.collection('funFacts').doc(factId).get();
    if (factDoc.exists) {
      favoriteFacts.push({
        id: factId,
        ...factDoc.data(),
        savedAt: favoriteDoc.data().savedAt
      });
    }
  }
  
  return favoriteFacts;
}
```

### 5. Fact Quiz System
**Purpose**: Reinforce learning through trivia questions about cultural facts.

#### 5.1 Quiz Generation
```javascript
async function generateFactQuiz(userId, difficulty = 'mixed') {
  const db = getFirestore();
  
  // Get user's viewed facts
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();
  const userData = userDoc.data();
  const viewedFactIds = new Set(userData.viewedFacts || []);
  
  // Get facts for quiz
  let factsQuery = db.collection('funFacts');
  if (difficulty !== 'mixed') {
    factsQuery = factsQuery.where('difficulty', '==', difficulty);
  }
  
  const factsSnapshot = await factsQuery
    .where('id', 'in', Array.from(viewedFactIds).slice(0, 10))
    .limit(5)
    .get();
  
  const facts = factsSnapshot.docs.map(doc => doc.data());
  
  // Generate quiz questions
  const quizQuestions = facts.map(fact => generateQuestionFromFact(fact));
  
  return {
    questions: quizQuestions,
    xpReward: 10,
    timeLimit: 60 // seconds
  };
}

function generateQuestionFromFact(fact) {
  const questionTypes = ['multiple_choice', 'true_false', 'fill_blank'];
  const selectedType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
  
  switch (selectedType) {
    case 'multiple_choice':
      return generateMultipleChoiceQuestion(fact);
    case 'true_false':
      return generateTrueFalseQuestion(fact);
    case 'fill_blank':
      return generateFillBlankQuestion(fact);
  }
}

function generateMultipleChoiceQuestion(fact) {
  // Extract key information from fact
  const keyTerms = fact.relatedVocabulary.map(v => v.english);
  const correctAnswer = keyTerms[Math.floor(Math.random() * keyTerms.length)];
  
  // Generate distractors
  const distractors = generateDistractors(correctAnswer, 3);
  const options = shuffleArray([correctAnswer, ...distractors]);
  
  return {
    type: 'multiple_choice',
    question: `Based on the fact about ${fact.category}, which term is related?`,
    factId: fact.id,
    options,
    correctAnswer,
    explanation: fact.contentEnglish
  };
}

function generateTrueFalseQuestion(fact) {
  const statements = [
    fact.contentEnglish,
    generateFalseStatement(fact)
  ];
  
  const correctAnswer = statements[0] === fact.contentEnglish;
  
  return {
    type: 'true_false',
    question: statements[Math.floor(Math.random() * statements.length)],
    factId: fact.id,
    correctAnswer,
    explanation: fact.contentEnglish
  };
}

function generateFillBlankQuestion(fact) {
  const vocab = fact.relatedVocabulary[0];
  const marathiWord = vocab.marathi;
  
  return {
    type: 'fill_blank',
    question: `Complete the Marathi word: ${marathiWord.substring(0, 2)}___`,
    factId: fact.id,
    correctAnswer: marathiWord,
    explanation: `${vocab.english} in Marathi is ${marathiWord}`
  };
}
```

#### 5.2 Quiz Scoring
```javascript
async function submitFactQuiz(userId, quizId, answers) {
  const db = getFirestore();
  let correctCount = 0;
  const results = [];
  
  for (const answer of answers) {
    const question = answer.question;
    const userAnswer = answer.userAnswer;
    const isCorrect = userAnswer === question.correctAnswer;
    
    if (isCorrect) {
      correctCount++;
    }
    
    results.push({
      question: question.question,
      userAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      explanation: question.explanation
    });
  }
  
  const score = (correctCount / answers.length) * 100;
  const xpEarned = Math.floor(score / 10); // 10 XP per 10% score
  
  // Award XP
  if (xpEarned > 0) {
    await awardXP(userId, 'fact_quiz', quizId, { 
      score,
      xpReward: xpEarned 
    });
  }
  
  // Record quiz attempt
  await db.collection('users').doc(userId)
    .collection('factQuizAttempts')
    .add({
      quizId,
      score,
      correctCount,
      totalQuestions: answers.length,
      xpEarned,
      completedAt: FieldValue.serverTimestamp()
    });
  
  return {
    score,
    correctCount,
    totalQuestions: answers.length,
    xpEarned,
    results
  };
}
```

### 6. Fact Collection and Gallery
**Purpose**: Provide a comprehensive view of all discovered cultural knowledge.

#### 6.1 Collection Display
```javascript
async function getUserFactCollection(userId) {
  const db = getFirestore();
  
  // Get user's viewed facts
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();
  const userData = userDoc.data();
  const viewedFactIds = new Set(userData.viewedFacts || []);
  
  // Get all facts
  const allFactsSnapshot = await db.collection('funFacts').get();
  const allFacts = allFactsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Categorize facts
  const collection = {
    viewed: [],
    favorites: [],
    byCategory: {}
  };
  
  // Initialize category collections
  Object.keys(FACT_CATEGORIES).forEach(category => {
    collection.byCategory[category] = [];
  });
  
  // Get favorites
  const favoritesSnapshot = await userRef
    .collection('favoriteFacts')
    .get();
  const favoriteIds = new Set(
    favoritesSnapshot.docs.map(doc => doc.data().factId)
  );
  
  // Organize facts
  allFacts.forEach(fact => {
    const isViewed = viewedFactIds.has(fact.id);
    const isFavorite = favoriteIds.has(fact.id);
    
    if (isViewed) {
      collection.viewed.push({
        ...fact,
        isFavorite
      });
    }
    
    if (isFavorite) {
      collection.favorites.push(fact);
    }
    
    collection.byCategory[fact.category].push({
      ...fact,
      isViewed,
      isFavorite
    });
  });
  
  // Calculate statistics
  collection.stats = {
    totalFacts: allFacts.length,
    viewedFacts: viewedFactIds.size,
    favoriteFacts: favoriteIds.size,
    completionPercentage: (viewedFactIds.size / allFacts.length) * 100,
    byCategory: {}
  };
  
  Object.keys(FACT_CATEGORIES).forEach(category => {
    const categoryFacts = collection.byCategory[category];
    const viewedInCategory = categoryFacts.filter(f => f.isViewed).length;
    
    collection.stats.byCategory[category] = {
      total: categoryFacts.length,
      viewed: viewedInCategory,
      percentage: (viewedInCategory / categoryFacts.length) * 100
    };
  });
  
  return collection;
}
```

### 7. UI/UX Specifications

#### 7.1 Fact Card Component
**Design Elements**:
- **Layout**: Card with rounded corners, subtle shadow
- **Header**: Category icon and name
- **Content**: 
  - Marathi text (prominent, larger)
  - Transliteration (italic, smaller)
  - English translation (regular, medium)
- **Vocabulary Section**: Related words with audio buttons
- **Image**: Cultural image (if available)
- **Actions**: Heart button (favorite), Share button
- **Animation**: Slide up with bounce effect

**Color Scheme**:
- **History**: #8B4513 (Brown)
- **Literature**: #4A148C (Purple)
- **Culture**: #C62828 (Red)
- **Food**: #FF6F00 (Orange)
- **Nature**: #2E7D32 (Green)
- **Festivals**: #E65100 (Dark Orange)

#### 7.2 Fact of the Day Widget
**Components**:
- **Home Screen Integration**: Prominent card on dashboard
- **Daily Indicator**: "Today's Fact" badge
- **Countdown**: Time until next fact
- **Quick Actions**: View, Share, Save
- **Progress**: Facts viewed this week

#### 7.3 Favorites Gallery
**Layout**:
- **Grid View**: 2-column grid of fact cards
- **Filter Options**: By category, date added
- **Search**: Full-text search across facts
- **Sort Options**: Date added, category, alphabetical
- **Empty State**: "No favorites yet" with encouragement

#### 7.4 Fact Collection Screen
**Sections**:
- **Overview**: Statistics and progress
- **Category Tabs**: Filter by category
- **Progress Indicators**: Completion per category
- **Fact Cards**: Viewed facts with status indicators
- **Locked Facts**: Grayed out with lock icon

### 8. Technical Implementation

#### 8.1 Firebase Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Fun facts - public read
    match /funFacts/{factId} {
      allow read: if true;
      allow write: if false; // Admin only
    }
    
    // User favorites - user read/write
    match /users/{userId}/favoriteFacts/{factId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Fact of the day - public read
    match /factOfTheDay/{date} {
      allow read: if true;
      allow write: if false; // System only
    }
    
    // User viewed facts - user read/write
    match /users/{userId}/viewedFacts/{factId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

#### 8.2 Performance Optimization
- **Image Caching**: Cache fact images locally
- **Lazy Loading**: Load fact content on demand
- **Preloading**: Preload next fact in sequence
- **Debounced Actions**: Throttle favorite toggles
- **Local Storage**: Cache viewed facts locally

#### 8.3 Offline Support
```javascript
// Cache facts for offline viewing
async function cacheFactsForOffline(userId) {
  const db = getFirestore();
  
  // Get user's viewed facts
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();
  const viewedFactIds = userData.viewedFacts || [];
  
  // Cache fact data
  const cachedFacts = {};
  for (const factId of viewedFactIds) {
    const factDoc = await db.collection('funFacts').doc(factId).get();
    if (factDoc.exists) {
      cachedFacts[factId] = factDoc.data();
    }
  }
  
  // Store in local storage
  await AsyncStorage.setItem('cached_facts', JSON.stringify(cachedFacts));
}
```

### 9. Testing Requirements

#### 9.1 Unit Tests
- Fact selection algorithms
- Quiz generation logic
- Scoring calculations
- Category filtering

#### 9.2 Integration Tests
- Firebase Firestore operations
- Favorite management
- Quiz submission
- Progress tracking

#### 9.3 E2E Tests
- Complete fact viewing flow
- Favorite management
- Quiz completion
- Collection browsing

#### 9.4 Performance Tests
- Fact load time: < 1 second
- Quiz generation: < 500ms
- Image loading: < 2 seconds
- Search response: < 300ms

### 10. Success Metrics

#### 10.1 User Engagement
- Average facts viewed per week: > 5
- Fact completion rate: > 70%
- Favorite usage rate: > 30%
- Quiz participation rate: > 50%

#### 10.2 Learning Impact
- Vocabulary retention improvement: > 15%
- Cultural knowledge scores: > 75%
- Fact quiz accuracy: > 80%
- User satisfaction: > 4.5/5

#### 10.3 Technical Performance
- Fact delivery latency: < 500ms
- Quiz generation time: < 1 second
- Image load time: < 2 seconds
- System uptime: > 99.5%

### 11. Future Enhancements

#### 11.1 Advanced Features
- **AI-Powered Recommendations**: Personalized fact suggestions
- **Interactive Timelines**: Historical event visualizations
- **Virtual Tours**: 360° images of cultural sites
- **Audio Narrations**: Professional voiceovers for facts
- **User-Generated Content**: Community fact submissions

#### 11.2 Content Expansion
- **Regional Variations**: District-specific cultural facts
- **Historical Periods**: Detailed era-based content
- **Biographical Sections**: Famous personalities
- **Language Evolution**: Marathi linguistic history
- **Modern Culture**: Contemporary Maharashtra

#### 11.3 Social Features
- **Fact Sharing**: Social media integration
- **Discussion Forums**: Community discussions
- **Fact Challenges**: Compete with friends
- **Collaborative Learning**: Group fact exploration
- **Achievement Sharing**: Badge and milestone sharing

#### 11.4 Analytics and Insights
- **Learning Patterns**: User behavior analysis
- **Content Performance**: Most popular facts
- **Engagement Metrics**: Detailed usage statistics
- **Personalization**: Adaptive content delivery
- **Progress Tracking**: Long-term learning insights
