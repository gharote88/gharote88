> **Migration Notice**: This spec was written for the original Firebase/Firestore architecture. The app has been fully migrated to **Supabase PostgreSQL + Vercel Serverless Functions**. All Firebase/Firestore references in code examples below are superseded by the implementation in `api/` and `supabase/migrations/`. Refer to `design.md` and `tasks.md` for the current architecture.

---

# Gamified User Journey Specification

## Overview
The gamified user journey is the core progression system that transforms language learning into an adventure across Maharashtra. Users start from their chosen city and travel toward Pune, unlocking lessons, earning rewards, and discovering cultural trivia along the way.

## Core Concepts

### 1. Journey Map System
**Purpose**: Visual representation of user's learning progress as a physical journey across Maharashtra.

**Data Structure**:
```javascript
// Journey Routes Collection
journeyRoutes/{routeId}
{
  startCity: "Mumbai",
  targetCity: "Pune",
  totalDistance: 150, // in kilometers
  estimatedDuration: 30, // in days of learning
  checkpoints: [
    {
      id: "checkpoint_1",
      name: "Thane",
      marathiName: "ठाणे",
      position: { x: 100, y: 200 }, // Map coordinates
      distanceFromStart: 25,
      requiredXp: 100,
      unlocks: {
        lessons: ["lesson_1", "lesson_2", "lesson_3"],
        trivia: "trivia_1",
        badges: ["badge_first_checkpoint"]
      },
      culturalContext: {
        description: "Historical city known for its lakes and forts",
        funFact: "Thane has over 30 lakes!"
      }
    },
    // ... more checkpoints
  ]
}

// User Journey Progress
users/{userId}/journey
{
  currentRouteId: "route_mumbai_to_pune",
  currentCheckpointIndex: 2,
  currentPosition: { x: 150, y: 250 },
  totalXpEarned: 350,
  progressPercentage: 23.3,
  completedCheckpoints: ["checkpoint_1"],
  unlockedLessons: ["lesson_1", "lesson_2", "lesson_3"],
  unlockedTrivia: ["trivia_1"],
  startedAt: timestamp,
  lastUpdated: timestamp
}
```

### 2. City Selection Onboarding
**Purpose**: Allow users to choose their starting point in Maharashtra, creating a personalized journey.

**UI Flow**:
1. **Welcome Screen**: Animated introduction with Maharashtra map
2. **City Selection Screen**: 
   - Display available starting cities (Mumbai, Pune, Nagpur, Aurangabad, Nashik)
   - Show city information cards with:
     - City name in English and Marathi
     - Distance to Pune
     - Estimated learning duration
     - Cultural highlights
   - Interactive map with city markers
3. **Confirmation Screen**: 
   - Show selected city and route preview
   - Display journey summary
   - "Start Journey" button with celebration animation

**City Data Structure**:
```javascript
startingCities/{cityId}
{
  name: "Mumbai",
  marathiName: "मुंबई",
  description: "The financial capital of India",
  distanceToPune: 150,
  estimatedDuration: 30,
  culturalHighlights: [
    "Gateway of India",
    "Marathi film industry",
    "Street food culture"
  ],
  imageUrl: "https://storage.googleapis.com/...",
  position: { x: 50, y: 100 }
}
```

### 3. Progression Mechanics
**Purpose**: Convert learning activities into physical journey progress.

**XP to Progress Conversion**:
```javascript
function calculateProgress(xpEarned, totalXpRequired) {
  return (xpEarned / totalXpRequired) * 100;
}

function updateJourneyPosition(userXp, checkpoints) {
  // Find current checkpoint based on XP
  let currentCheckpoint = checkpoints[0];
  let nextCheckpoint = checkpoints[1];
  
  for (let i = 0; i < checkpoints.length; i++) {
    if (userXp >= checkpoints[i].requiredXp) {
      currentCheckpoint = checkpoints[i];
      nextCheckpoint = checkpoints[i + 1];
    }
  }
  
  // Calculate position between checkpoints
  if (nextCheckpoint) {
    const progressBetweenCheckpoints = 
      (userXp - currentCheckpoint.requiredXp) / 
      (nextCheckpoint.requiredXp - currentCheckpoint.requiredXp);
    
    return {
      x: currentCheckpoint.position.x + 
          (nextCheckpoint.position.x - currentCheckpoint.position.x) * progressBetweenCheckpoints,
      y: currentCheckpoint.position.y + 
          (nextCheckpoint.position.y - currentCheckpoint.position.y) * progressBetweenCheckpoints
    };
  }
  
  return currentCheckpoint.position;
}
```

**Checkpoint Unlock System**:
```javascript
function checkCheckpointUnlocks(userXp, checkpoints) {
  const newUnlocks = [];
  
  checkpoints.forEach(checkpoint => {
    if (userXp >= checkpoint.requiredXp && !checkpoint.unlocked) {
      newUnlocks.push({
        checkpointId: checkpoint.id,
        lessons: checkpoint.unlocks.lessons,
        trivia: checkpoint.unlocks.trivia,
        badges: checkpoint.unlocks.badges
      });
    }
  });
  
  return newUnlocks;
}
```

### 4. Visual Map Component
**Purpose**: Interactive visualization of the user's journey.

**Component Specifications**:

**MapCanvas**:
- **Technology**: Expo Canvas / SVG
- **Features**:
  - Render Maharashtra outline with cities
  - Draw route path with animated line
  - Display user avatar at current position
  - Show completed and upcoming checkpoints
  - Interactive tap on checkpoints for details
  - Smooth avatar movement animations
  - Progress indicator overlay

**Avatar**:
- **Customizable**: Based on user's avatar items
- **Animation**: Walking/bouncing movement along route
- **Position**: Updates in real-time based on progress
- **Effects**: Celebration particles when reaching checkpoints

**Checkpoint Markers**:
- **States**: Locked, Current, Completed
- **Visuals**: Different icons/colors for each state
- **Interactions**: Tap to show details popup
- **Animations**: Pulse effect for current checkpoint

**Progress Bar**:
- **Display**: Percentage of journey completed
- **Visual**: Gradient bar with milestone markers
- **Animation**: Smooth fill on progress updates

### 5. Milestone Rewards System
**Purpose**: Provide meaningful rewards and motivation at journey milestones.

**Reward Types**:

**Lesson Unlocks**:
```javascript
{
  type: "lesson_unlock",
  lessons: ["lesson_4", "lesson_5"],
  notification: "🎉 New lessons unlocked! Continue your journey to Pune."
}
```

**Trivia Unlocks**:
```javascript
{
  type: "trivia_unlock",
  triviaId: "trivia_2",
  content: {
    category: "history",
    title: "Shivaji Maharaj's Forts",
    description: "Learn about the strategic forts built by Shivaji Maharaj",
    marathiContent: "शिवाजी महाराजांची किल्ले"
  },
  notification: "📚 New cultural knowledge unlocked!"
}
```

**Badge Awards**:
```javascript
{
  type: "badge_award",
  badgeId: "badge_first_checkpoint",
  badge: {
    name: "First Steps",
    description: "Complete your first journey checkpoint",
    iconUrl: "https://storage.googleapis.com/...",
    xpReward: 50
  },
  notification: "🏅 Badge earned: First Steps!"
}
```

**Celebration Animations**:
- Confetti explosion
- Avatar dance animation
- Sound effects (success chime)
- Screen flash effect
- Progress bar fill animation

### 6. Real-time Progress Updates
**Purpose**: Keep the journey map synchronized with user's learning activities.

**Firebase Realtime Integration**:
```javascript
// Listen to user XP changes
const userXpRef = database.ref(`users/${userId}/gamification/totalXp`);
userXpRef.on('value', (snapshot) => {
  const newXp = snapshot.val();
  updateJourneyProgress(newXp);
});

// Update journey position
function updateJourneyProgress(xp) {
  const newPosition = updateJourneyPosition(xp, checkpoints);
  const newUnlocks = checkCheckpointUnlocks(xp, checkpoints);
  
  // Update Firestore
  firestore.collection('users').doc(userId).update({
    'journey.currentPosition': newPosition,
    'journey.totalXpEarned': xp,
    'journey.progressPercentage': calculateProgress(xp, totalXpRequired)
  });
  
  // Trigger rewards if new unlocks
  if (newUnlocks.length > 0) {
    triggerRewards(newUnlocks);
  }
}
```

### 7. Journey Completion
**Purpose**: Celebrate reaching Pune and provide closure to the journey.

**Completion Flow**:
1. **Final Approach**: Special animation as user approaches Pune
2. **Arrival Screen**: 
   - Celebration animation with fireworks
   - "Welcome to Pune!" message in Marathi and English
   - Journey statistics (total XP, time taken, lessons completed)
   - Final badge award: "Pune Explorer"
3. **Certificate**: 
   - Generate journey completion certificate
   - Include user's avatar and journey stats
   - Shareable image for social media
4. **New Journey Option**: 
   - Offer to start a new journey from different city
   - Unlock advanced content and challenges

**Completion Data**:
```javascript
users/{userId}/completedJourneys
{
  journeyId: "route_mumbai_to_pune",
  completedAt: timestamp,
  totalXpEarned: 5000,
  timeTaken: 45, // days
  lessonsCompleted: 30,
  checkpointsReached: 10,
  badgesEarned: ["badge_first_checkpoint", "badge_pune_explorer"],
  certificateUrl: "https://storage.googleapis.com/..."
}
```

## UI/UX Specifications

### Color Scheme
- **Primary**: #FF6B35 (Journey Orange)
- **Secondary**: #004E89 (Maharashtra Blue)
- **Success**: #4CAF50 (Progress Green)
- **Warning**: #FFC107 (Checkpoint Yellow)
- **Background**: #F5F5F5 (Map Light Gray)

### Typography
- **Headings**: 'Poppins', bold, 24-32px
- **Body**: 'Open Sans', regular, 16-18px
- **Marathi Text**: 'Noto Sans Devanagari', regular, 18-20px

### Animations
- **Avatar Movement**: 500ms ease-in-out
- **Checkpoint Unlock**: 300ms bounce
- **Progress Bar Fill**: 1000ms ease-out
- **Celebration**: 2000ms confetti explosion
- **Map Zoom**: 400ms smooth

### Accessibility
- **Screen Reader**: Full map description available
- **Color Contrast**: WCAG AA compliant
- **Touch Targets**: Minimum 44x44px
- **Keyboard Navigation**: Full keyboard support for web

## Technical Implementation

### Firebase Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Journey routes - public read
    match /journeyRoutes/{routeId} {
      allow read: if true;
      allow write: if false;
    }
    
    // User journey - user read/write
    match /users/{userId}/journey {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Starting cities - public read
    match /startingCities/{cityId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

### Performance Optimization
- **Map Rendering**: Use canvas for better performance
- **Image Caching**: Cache map images locally
- **Debounced Updates**: Throttle position updates to 100ms
- **Lazy Loading**: Load checkpoint details on demand

### Error Handling
- **Network Issues**: Show offline indicator, cache last position
- **Data Corruption**: Validate journey data, reset if corrupted
- **Sync Conflicts**: Use server timestamp for conflict resolution

## Testing Requirements

### Unit Tests
- Journey position calculation
- XP to progress conversion
- Checkpoint unlock logic
- Reward triggering system

### Integration Tests
- Firebase Realtime sync
- Firestore journey updates
- Authentication integration
- Offline behavior

### E2E Tests
- Complete onboarding flow
- Journey from start to finish
- All checkpoint unlocks
- Reward system functionality

### Performance Tests
- Map rendering at 60fps
- Smooth avatar movement
- Real-time update latency < 100ms
- Memory usage < 100MB

## Success Metrics

### User Engagement
- Journey completion rate: > 60%
- Average time to first checkpoint: < 3 days
- Daily active users during journey: > 40%

### Learning Outcomes
- XP earned per journey: > 4000
- Lessons completed per journey: > 25
- Quiz accuracy improvement: > 15%

### Technical Performance
- Map load time: < 2 seconds
- Position update latency: < 100ms
- Crash rate: < 0.1%

## Future Enhancements

### Multiplayer Journeys
- Friend journeys on same map
- Race to Pune mode
- Cooperative challenges

### Dynamic Routes
- Procedural route generation
- Random events and encounters
- Seasonal themes and decorations

### Advanced Features
- Journey branching and choices
- Hidden checkpoints and secrets
- Achievement hunting system
- Journey customization options
