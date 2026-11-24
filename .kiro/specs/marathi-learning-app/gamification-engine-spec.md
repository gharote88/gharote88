> **Migration Notice**: This spec was written for the original Firebase/Firestore architecture. The app has been fully migrated to **Supabase PostgreSQL + Vercel Serverless Functions**. All Firebase/Firestore references in code examples below are superseded by the implementation in `api/` and `supabase/migrations/`. Refer to `design.md` and `tasks.md` for the current architecture.

---

# Gamification Engine Specification

## Overview
The gamification engine is the motivational core of the Marathi Learning App, transforming language learning into an engaging, reward-driven experience. It encompasses XP systems, leveling, badges, streaks, daily challenges, leaderboards, and avatar customization.

## Core Gamification Components

### 1. XP (Experience Points) System
**Purpose**: Reward user engagement and progress through a points-based system.

#### 1.1 XP Sources and Values
```javascript
const XP_VALUES = {
  lesson: {
    completion: 50,
    perfectScore: 20, // Bonus for 100% score
    timeBonus: 10     // Bonus for completing quickly
  },
  quiz: {
    base: 10,
    correctAnswer: 5,
    perfectQuiz: 30,  // All answers correct
    speedBonus: 15    // Bonus for fast completion
  },
  speaking: {
    attempt: 5,
    goodScore: 15,    // Score > 70%
    excellentScore: 20 // Score > 90%
  },
  writing: {
    character: 10,
    word: 20,
    sentence: 30,
    mastery: 15       // Bonus for mastering character
  },
  reading: {
    passage: 30,
    comprehension: 20,
    readAloud: 20,
    speedBonus: 10
  },
  dailyChallenge: {
    completion: 40,
    perfectScore: 20
  },
  streak: {
    daily: 10,
    weeklyBonus: 50,
    monthlyBonus: 100
  },
  factQuiz: {
    correct: 10,
    streakBonus: 5
  },
  miniGame: {
    participation: 5,
    win: 25,
    highScore: 15
  }
};
```

#### 1.2 XP Calculation and Awarding
```javascript
async function awardXP(userId, source, referenceId, metadata = {}) {
  const db = getFirestore();
  const userRef = db.collection('users').doc(userId);
  
  // Calculate XP amount
  const xpAmount = calculateXPAmount(source, metadata);
  
  // Get current user data
  const userDoc = await userRef.get();
  const userData = userDoc.data();
  const currentXP = userData.gamification.totalXp || 0;
  const newXP = currentXP + xpAmount;
  
  // Calculate new level
  const newLevel = calculateLevel(newXP);
  const levelUp = newLevel > userData.gamification.level;
  
  // Update user XP
  await userRef.update({
    'gamification.totalXp': newXP,
    'gamification.level': newLevel,
    'gamification.levelTitle': getLevelTitle(newLevel),
    'updatedAt': FieldValue.serverTimestamp()
  });
  
  // Create XP transaction record
  await db.collection('users').doc(userId)
    .collection('xpTransactions').add({
      xpAmount,
      source,
      referenceId,
      metadata,
      createdAt: FieldValue.serverTimestamp()
    });
  
  // Check for level up
  if (levelUp) {
    await handleLevelUp(userId, newLevel);
  }
  
  // Check for badge unlocks
  await checkBadgeUnlocks(userId, newXP, newLevel);
  
  return {
    xpAwarded: xpAmount,
    totalXP: newXP,
    level: newLevel,
    levelUp
  };
}

function calculateXPAmount(source, metadata) {
  const baseXP = XP_VALUES[source]?.base || 0;
  let totalXP = baseXP;
  
  // Add bonuses based on metadata
  if (metadata.perfectScore && XP_VALUES[source]?.perfectScore) {
    totalXP += XP_VALUES[source].perfectScore;
  }
  
  if (metadata.speedBonus && XP_VALUES[source]?.speedBonus) {
    totalXP += XP_VALUES[source].speedBonus;
  }
  
  if (metadata.score) {
    // Calculate score-based bonus
    const scoreBonus = Math.floor(metadata.score / 10) * 5;
    totalXP += scoreBonus;
  }
  
  return totalXP;
}
```

#### 1.3 Level System
```javascript
const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: "Beginner" },
  { level: 2, xp: 500, title: "Explorer" },
  { level: 3, xp: 1000, title: "Speaker" },
  { level: 4, xp: 2000, title: "Storyteller" },
  { level: 5, xp: 3500, title: "Champion" },
  { level: 6, xp: 5000, title: "Master" },
  { level: 7, xp: 7500, title: "Legend" },
  { level: 8, xp: 10000, title: "Guru" },
  { level: 9, xp: 15000, title: "Pandit" },
  { level: 10, xp: 20000, title: "Marathi Ratna" }
];

function calculateLevel(totalXP) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i].xp) {
      return LEVEL_THRESHOLDS[i].level;
    }
  }
  return 1;
}

function getLevelTitle(level) {
  const levelData = LEVEL_THRESHOLDS.find(l => l.level === level);
  return levelData ? levelData.title : "Beginner";
}

function getXPToNextLevel(currentXP) {
  const currentLevel = calculateLevel(currentXP);
  const nextLevelData = LEVEL_THRESHOLDS.find(l => l.level === currentLevel + 1);
  
  if (!nextLevelData) {
    return { xpNeeded: 0, progress: 100 }; // Max level
  }
  
  const currentLevelData = LEVEL_THRESHOLDS.find(l => l.level === currentLevel);
  const xpInCurrentLevel = currentXP - currentLevelData.xp;
  const xpNeededForNextLevel = nextLevelData.xp - currentLevelData.xp;
  const progress = (xpInCurrentLevel / xpNeededForNextLevel) * 100;
  
  return {
    xpNeeded: xpNeededForNextLevel - xpInCurrentLevel,
    progress: Math.min(100, Math.max(0, progress))
  };
}
```

### 2. Streak System
**Purpose**: Encourage consistent daily learning through streak tracking and rewards.

#### 2.1 Streak Mechanics
```javascript
async function updateStreak(userId) {
  const db = getFirestore();
  const userRef = db.collection('users').doc(userId);
  
  const userDoc = await userRef.get();
  const userData = userDoc.data();
  const streakData = userData.gamification || {};
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastActivity = streakData.lastActivityDate ? 
    new Date(streakData.lastActivityDate) : null;
  
  let newStreak = streakData.currentStreak || 0;
  let longestStreak = streakData.longestStreak || 0;
  let streakFreezeUsed = false;
  
  if (!lastActivity) {
    // First activity
    newStreak = 1;
  } else {
    const daysSinceLastActivity = Math.floor(
      (today - lastActivity) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastActivity === 0) {
      // Already active today, no change
      return { streak: newStreak, updated: false };
    } else if (daysSinceLastActivity === 1) {
      // Consecutive day
      newStreak++;
    } else if (daysSinceLastActivity > 1) {
      // Streak broken, check for freeze
      if (streakData.streakFreezeAvailable && daysSinceLastActivity <= 2) {
        // Use streak freeze
        streakFreezeUsed = true;
        // Streak continues but freeze is used
      } else {
        // Streak broken
        longestStreak = Math.max(longestStreak, newStreak);
        newStreak = 1;
      }
    }
  }
  
  // Update streak data
  await userRef.update({
    'gamification.currentStreak': newStreak,
    'gamification.longestStreak': Math.max(longestStreak, newStreak),
    'gamification.lastActivityDate': today,
    'gamification.streakFreezeAvailable': streakFreezeUsed ? false : true,
    'gamification.streakFreezeUsedAt': streakFreezeUsed ? today : null,
    'updatedAt': FieldValue.serverTimestamp()
  });
  
  // Award streak XP
  if (newStreak > 0) {
    await awardXP(userId, 'streak', null, { 
      streakCount: newStreak,
      daily: true 
    });
  }
  
  // Check for weekly/monthly bonuses
  if (newStreak % 7 === 0) {
    await awardXP(userId, 'streak', null, { 
      streakCount: newStreak,
      weeklyBonus: true 
    });
  }
  
  if (newStreak % 30 === 0) {
    await awardXP(userId, 'streak', null, { 
      streakCount: newStreak,
      monthlyBonus: true 
    });
  }
  
  return {
    streak: newStreak,
    longestStreak: Math.max(longestStreak, newStreak),
    updated: true,
    freezeUsed: streakFreezeUsed
  };
}
```

#### 2.2 Streak Freeze System
```javascript
async function resetStreakFreeze(userId) {
  const db = getFirestore();
  const userRef = db.collection('users').doc(userId);
  
  // Reset streak freeze every Monday
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  if (dayOfWeek === 1) { // Monday
    await userRef.update({
      'gamification.streakFreezeAvailable': true,
      'gamification.streakFreezeUsedAt': null
    });
  }
}

// Scheduled function to reset streak freezes weekly
exports.resetWeeklyStreakFreezes = functions.pubsub
  .schedule('0 0 * * 1') // Every Monday at midnight
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    const db = getFirestore();
    const usersSnapshot = await db.collection('users').get();
    
    const batch = db.batch();
    usersSnapshot.forEach(doc => {
      const userRef = doc.ref;
      batch.update(userRef, {
        'gamification.streakFreezeAvailable': true,
        'gamification.streakFreezeUsedAt': null
      });
    });
    
    await batch.commit();
    console.log('Reset streak freezes for all users');
  });
```

### 3. Badge System
**Purpose**: Recognize achievements and provide long-term goals.

#### 3.1 Badge Definitions
```javascript
const BADGES = [
  {
    id: "first_lesson",
    name: "First Steps",
    description: "Complete your first lesson",
    iconUrl: "https://storage.googleapis.com/badges/first_lesson.png",
    criteria: {
      type: "lesson_completion",
      count: 1
    },
    xpReward: 50,
    rarity: "common"
  },
  {
    id: "streak_warrior",
    name: "Streak Warrior",
    description: "Maintain a 7-day learning streak",
    iconUrl: "https://storage.googleapis.com/badges/streak_warrior.png",
    criteria: {
      type: "streak",
      count: 7
    },
    xpReward: 100,
    rarity: "rare"
  },
  {
    id: "pronunciation_master",
    name: "Pronunciation Master",
    description: "Score 90% or higher on 10 speaking exercises",
    iconUrl: "https://storage.googleapis.com/badges/pronunciation_master.png",
    criteria: {
      type: "speaking_excellence",
      count: 10,
      minScore: 90
    },
    xpReward: 150,
    rarity: "epic"
  },
  {
    id: "marathi_ratna",
    name: "Marathi Ratna",
    description: "Reach Level 10",
    iconUrl: "https://storage.googleapis.com/badges/marathi_ratna.png",
    criteria: {
      type: "level",
      level: 10
    },
    xpReward: 500,
    rarity: "legendary"
  }
];
```

#### 3.2 Badge Evaluation System
```javascript
async function checkBadgeUnlocks(userId, totalXP, level) {
  const db = getFirestore();
  const userRef = db.collection('users').doc(userId);
  
  // Get user's current badges
  const earnedBadgesSnapshot = await userRef
    .collection('badges')
    .get();
  const earnedBadgeIds = new Set(
    earnedBadgesSnapshot.docs.map(doc => doc.id)
  );
  
  // Check each badge
  for (const badge of BADGES) {
    if (earnedBadgeIds.has(badge.id)) continue;
    
    const unlocked = await evaluateBadgeCriteria(userId, badge.criteria);
    
    if (unlocked) {
      await awardBadge(userId, badge);
    }
  }
}

async function evaluateBadgeCriteria(userId, criteria) {
  const db = getFirestore();
  const userRef = db.collection('users').doc(userId);
  
  switch (criteria.type) {
    case 'lesson_completion':
      const lessonsCompleted = await userRef
        .collection('progress')
        .where('status', '==', 'completed')
        .get();
      return lessonsCompleted.size >= criteria.count;
    
    case 'streak':
      const userDoc = await userRef.get();
      const userData = userDoc.data();
      return userData.gamification.currentStreak >= criteria.count;
    
    case 'speaking_excellence':
      const speakingAttempts = await userRef
        .collection('speakingAttempts')
        .where('score', '>=', criteria.minScore)
        .get();
      return speakingAttempts.size >= criteria.count;
    
    case 'level':
      const userLevelDoc = await userRef.get();
      const userLevelData = userLevelDoc.data();
      return userLevelData.gamification.level >= criteria.level;
    
    default:
      return false;
  }
}

async function awardBadge(userId, badge) {
  const db = getFirestore();
  const userRef = db.collection('users').doc(userId);
  
  // Add badge to user's collection
  await userRef.collection('badges').doc(badge.id).set({
    earnedAt: FieldValue.serverTimestamp()
  });
  
  // Award badge XP
  await awardXP(userId, 'badge', badge.id, { 
    badgeName: badge.name,
    xpReward: badge.xpReward 
  });
  
  // Send notification
  await sendBadgeNotification(userId, badge);
  
  console.log(`Badge awarded: ${badge.name} to user ${userId}`);
}
```

### 4. Daily Challenges
**Purpose**: Provide daily goals and variety in learning activities.

#### 4.1 Challenge Generation
```javascript
async function generateDailyChallenge() {
  const db = getFirestore();
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  
  // Check if challenge already exists for today
  const existingChallenge = await db
    .collection('dailyChallenges')
    .where('date', '==', dateStr)
    .get();
  
  if (!existingChallenge.empty) {
    return existingChallenge.docs[0].data();
  }
  
  // Generate new challenge
  const challengeTypes = ['speaking', 'writing', 'reading', 'mini_game'];
  const selectedType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
  
  const challenge = {
    date: dateStr,
    title: generateChallengeTitle(selectedType),
    description: generateChallengeDescription(selectedType),
    challengeType: selectedType,
    config: generateChallengeConfig(selectedType),
    xpReward: 40,
    createdAt: FieldValue.serverTimestamp()
  };
  
  await db.collection('dailyChallenges').add(challenge);
  
  return challenge;
}

function generateChallengeTitle(type) {
  const titles = {
    speaking: "Speak Like a Local",
    writing: "Master the Script",
    reading: "Story Time",
    mini_game: "Quick Challenge"
  };
  return titles[type];
}

function generateChallengeConfig(type) {
  const configs = {
    speaking: {
      phrases: ["phrase_1", "phrase_2", "phrase_3"],
      minScore: 70,
      attempts: 3
    },
    writing: {
      characters: ["char_1", "char_2", "char_3"],
      minAccuracy: 80,
      attempts: 2
    },
    reading: {
      passage: "passage_1",
      minComprehension: 75,
      timeLimit: 120
    },
    mini_game: {
      gameType: "word_scramble",
      words: 5,
      timeLimit: 60
    }
  };
  return configs[type];
}
```

#### 4.2 Challenge Completion
```javascript
async function completeDailyChallenge(userId, challengeId, score, metadata) {
  const db = getFirestore();
  const userRef = db.collection('users').doc(userId);
  
  // Check if already completed
  const existingCompletion = await userRef
    .collection('dailyChallengeCompletions')
    .doc(challengeId)
    .get();
  
  if (existingCompletion.exists) {
    return { alreadyCompleted: true };
  }
  
  // Calculate XP based on score
  let xpEarned = 40;
  if (score >= 90) {
    xpEarned += 20; // Perfect score bonus
  }
  
  // Record completion
  await userRef.collection('dailyChallengeCompletions').doc(challengeId).set({
    challengeId,
    score,
    xpEarned,
    completedAt: FieldValue.serverTimestamp(),
    metadata
  });
  
  // Award XP
  await awardXP(userId, 'daily_challenge', challengeId, { 
    score,
    xpReward: xpEarned 
  });
  
  // Update streak
  await updateStreak(userId);
  
  return {
    completed: true,
    xpEarned,
    score
  };
}
```

### 5. Leaderboard System
**Purpose**: Foster healthy competition and social motivation.

#### 5.1 Weekly Leaderboard
```javascript
async function updateWeeklyLeaderboard() {
  const db = getFirestore();
  const now = new Date();
  const weekStart = getWeekStart(now);
  
  // Get all users
  const usersSnapshot = await db.collection('users').get();
  
  const leaderboardData = [];
  
  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    // Calculate weekly XP
    const weeklyXP = await calculateWeeklyXP(userId, weekStart);
    
    leaderboardData.push({
      userId,
      name: userData.name,
      avatarUrl: userData.avatarUrl,
      weeklyXP,
      level: userData.gamification.level
    });
  }
  
  // Sort by weekly XP
  leaderboardData.sort((a, b) => b.weeklyXP - a.weeklyXP);
  
  // Assign ranks
  leaderboardData.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  
  // Store in leaderboard collection
  const batch = db.batch();
  leaderboardData.forEach(entry => {
    const entryRef = db.collection('leaderboard').doc();
    batch.set(entryRef, {
      ...entry,
      weekStart,
      updatedAt: FieldValue.serverTimestamp()
    });
  });
  
  await batch.commit();
  
  console.log('Weekly leaderboard updated');
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function calculateWeeklyXP(userId, weekStart) {
  const db = getFirestore();
  
  const xpTransactions = await db
    .collection('users')
    .doc(userId)
    .collection('xpTransactions')
    .where('createdAt', '>=', weekStart)
    .get();
  
  let totalXP = 0;
  xpTransactions.forEach(doc => {
    totalXP += doc.data().xpAmount;
  });
  
  return totalXP;
}
```

#### 5.2 Leaderboard Reset
```javascript
// Scheduled function to reset leaderboard weekly
exports.resetWeeklyLeaderboard = functions.pubsub
  .schedule('0 0 * * 1') // Every Monday at midnight
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    const db = getFirestore();
    
    // Archive old leaderboard
    const oldLeaderboard = await db
      .collection('leaderboard')
      .where('weekStart', '<', getWeekStart(new Date()))
      .get();
    
    const archiveBatch = db.batch();
    oldLeaderboard.forEach(doc => {
      const archiveRef = db.collection('leaderboardArchive').doc(doc.id);
      archiveBatch.set(archiveRef, doc.data());
    });
    await archiveBatch.commit();
    
    // Delete old leaderboard
    const deleteBatch = db.batch();
    oldLeaderboard.forEach(doc => {
      deleteBatch.delete(doc.ref);
    });
    await deleteBatch.commit();
    
    // Generate new leaderboard
    await updateWeeklyLeaderboard();
    
    console.log('Weekly leaderboard reset and updated');
  });
```

### 6. Avatar Customization
**Purpose**: Provide personalization and achievement-based rewards.

#### 6.1 Avatar Items System
```javascript
const AVATAR_CATEGORIES = {
  hair: [
    { id: "hair_1", name: "Short Hair", xpCost: 100, levelRequired: 1 },
    { id: "hair_2", name: "Long Hair", xpCost: 200, levelRequired: 2 },
    { id: "hair_3", name: "Curly Hair", xpCost: 300, levelRequired: 3 }
  ],
  outfit: [
    { id: "outfit_1", name: "Casual Wear", xpCost: 150, levelRequired: 1 },
    { id: "outfit_2", name: "Traditional Dress", xpCost: 250, levelRequired: 3 },
    { id: "outfit_3", name: "Festival Outfit", xpCost: 400, levelRequired: 5 }
  ],
  accessory: [
    { id: "acc_1", name: "Glasses", xpCost: 100, levelRequired: 2 },
    { id: "acc_2", name: "Hat", xpCost: 200, levelRequired: 4 },
    { id: "acc_3", name: "Marathi Cap", xpCost: 300, levelRequired: 6 }
  ],
  background: [
    { id: "bg_1", name: "City Background", xpCost: 50, levelRequired: 1 },
    { id: "bg_2", name: "Nature Background", xpCost: 150, levelRequired: 3 },
    { id: "bg_3", name: "Festival Background", xpCost: 250, levelRequired: 5 }
  ]
};

async function unlockAvatarItem(userId, itemId) {
  const db = getFirestore();
  const userRef = db.collection('users').doc(userId);
  
  // Find item details
  let itemDetails = null;
  for (const category of Object.values(AVATAR_CATEGORIES)) {
    const item = category.find(i => i.id === itemId);
    if (item) {
      itemDetails = item;
      break;
    }
  }
  
  if (!itemDetails) {
    throw new Error('Item not found');
  }
  
  // Check if user meets requirements
  const userDoc = await userRef.get();
  const userData = userDoc.data();
  const userXP = userData.gamification.totalXp;
  const userLevel = userData.gamification.level;
  
  if (userXP < itemDetails.xpCost || userLevel < itemDetails.levelRequired) {
    throw new Error('User does not meet requirements');
  }
  
  // Check if already unlocked
  const unlockedItems = userData.avatar?.unlockedItems || [];
  if (unlockedItems.includes(itemId)) {
    return { alreadyUnlocked: true };
  }
  
  // Deduct XP and unlock item
  await userRef.update({
    'gamification.totalXp': userXP - itemDetails.xpCost,
    'avatar.unlockedItems': [...unlockedItems, itemId],
    'updatedAt': FieldValue.serverTimestamp()
  });
  
  // Create transaction record
  await userRef.collection('xpTransactions').add({
    xpAmount: -itemDetails.xpCost,
    source: 'avatar_unlock',
    referenceId: itemId,
    metadata: { itemName: itemDetails.name },
    createdAt: FieldValue.serverTimestamp()
  });
  
  return {
    unlocked: true,
    item: itemDetails,
    remainingXP: userXP - itemDetails.xpCost
  };
}

async function equipAvatarItem(userId, itemId, category) {
  const db = getFirestore();
  const userRef = db.collection('users').doc(userId);
  
  // Check if item is unlocked
  const userDoc = await userRef.get();
  const userData = userDoc.data();
  const unlockedItems = userData.avatar?.unlockedItems || [];
  
  if (!unlockedItems.includes(itemId)) {
    throw new Error('Item not unlocked');
  }
  
  // Update equipped items
  const equippedItems = userData.avatar?.equippedItems || {};
  equippedItems[category] = itemId;
  
  await userRef.update({
    'avatar.equippedItems': equippedItems,
    'updatedAt': FieldValue.serverTimestamp()
  });
  
  return { equipped: true, equippedItems };
}
```

## Real-time Updates

### Firebase Realtime Database Integration
```javascript
// Set up real-time listeners for gamification updates
function setupGamificationListeners(userId) {
  const database = getDatabase();
  
  // XP updates
  const xpRef = ref(database, `users/${userId}/gamification/totalXp`);
  onValue(xpRef, (snapshot) => {
    const totalXP = snapshot.val();
    updateXPDisplay(totalXP);
    checkLevelUp(totalXP);
  });
  
  // Streak updates
  const streakRef = ref(database, `users/${userId}/gamification/currentStreak`);
  onValue(streakRef, (snapshot) => {
    const streak = snapshot.val();
    updateStreakDisplay(streak);
  });
  
  // Badge updates
  const badgesRef = ref(database, `users/${userId}/badges`);
  onChildAdded(badgesRef, (snapshot) => {
    const badge = snapshot.val();
    showBadgeNotification(badge);
  });
}
```

## UI/UX Specifications

### Gamification Dashboard
**Components**:
- **XP Progress Bar**: Visual representation of XP to next level
- **Level Display**: Current level with title and icon
- **Streak Counter**: Current streak with fire animation
- **Badge Showcase**: Grid of earned badges with locked badges grayed out
- **Leaderboard Position**: User's rank and top performers
- **Daily Challenge Card**: Today's challenge with progress
- **Avatar Preview**: Current avatar with customization options

### Animations and Effects
- **XP Gain**: Floating numbers animation (+50 XP)
- **Level Up**: Screen flash, confetti, level-up sound
- **Badge Earn**: Badge pop-up with shine effect
- **Streak Fire**: Animated flame that grows with streak
- **Progress Bar**: Smooth fill animation
- **Leaderboard Update**: Rank change animation

### Color Scheme
- **XP Bar**: #FFD700 (Gold)
- **Level Up**: #FF6B35 (Orange)
- **Streak**: #FF5722 (Red-Orange)
- **Badges**: #9C27B0 (Purple)
- **Leaderboard**: #2196F3 (Blue)
- **Success**: #4CAF50 (Green)

## Technical Implementation

### Firebase Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // XP transactions - user read/write only
    match /users/{userId}/xpTransactions/{transactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Badges - user read, system write
    match /users/{userId}/badges/{badgeId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // System only
    }
    
    // Leaderboard - public read, system write
    match /leaderboard/{entryId} {
      allow read: if true;
      allow write: if false; // System only
    }
    
    // Daily challenges - public read, system write
    match /dailyChallenges/{challengeId} {
      allow read: if true;
      allow write: if false; // System only
    }
  }
}
```

### Performance Optimization
- **Batch Operations**: Group multiple Firestore writes
- **Caching**: Cache gamification data locally
- **Debounced Updates**: Throttle real-time updates
- **Lazy Loading**: Load leaderboard data on demand
- **Index Optimization**: Create Firestore indexes for queries

### Error Handling
- **XP Calculation Errors**: Log and use default values
- **Streak Update Failures**: Retry with exponential backoff
- **Badge Evaluation Errors**: Continue with other badges
- **Leaderboard Update Failures**: Schedule retry

## Testing Requirements

### Unit Tests
- XP calculation algorithms
- Level progression logic
- Streak update mechanics
- Badge evaluation criteria
- Avatar unlock validation

### Integration Tests
- Firebase Cloud Functions
- Real-time database updates
- Firestore transactions
- Scheduled functions execution

### E2E Tests
- Complete gamification flow
- Level up experience
- Badge earning process
- Daily challenge completion
- Leaderboard updates

### Performance Tests
- XP award latency: < 500ms
- Streak update latency: < 300ms
- Badge evaluation: < 1 second
- Leaderboard generation: < 5 seconds

## Success Metrics

### User Engagement
- Average daily XP earned: > 100
- Level completion rate: > 80%
- Streak maintenance: > 40% of users
- Badge collection rate: > 60%

### Motivation Impact
- Daily active users increase: > 25%
- Session duration increase: > 30%
- Lesson completion rate increase: > 20%
- User retention improvement: > 15%

### Technical Performance
- Gamification update latency: < 1 second
- Real-time sync reliability: > 99%
- Leaderboard accuracy: > 99.9%
- System uptime: > 99.5%

## Future Enhancements

### Advanced Features
- Achievement trees and branching paths
- Seasonal events and special challenges
- Guild/team-based competitions
- Custom achievement creation
- Social sharing and bragging rights

### Personalization
- Adaptive difficulty based on performance
- Personalized challenge recommendations
- Custom badge creation
- Avatar progression system
- Learning style-based rewards

### Analytics
- Detailed engagement metrics
- A/B testing for gamification elements
- User behavior prediction
- Churn prevention algorithms
- Performance optimization insights
