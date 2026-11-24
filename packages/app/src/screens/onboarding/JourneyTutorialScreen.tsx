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
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  animation: string;
  tips: string[];
}

const JourneyTutorialScreen: React.FC = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'step_1',
      title: 'Welcome to Your Journey!',
      description: 'Your Marathi learning adventure is about to begin. Let us show you how to navigate your journey map.',
      animation: 'welcome',
      tips: [
        'Complete lessons to earn XP',
        'Unlock new checkpoints as you progress',
        'Discover cultural trivia along the way',
      ],
    },
    {
      id: 'step_2',
      title: 'Understanding the Map',
      description: 'The journey map shows your progress from your starting city to Pune. Each checkpoint represents a milestone in your learning.',
      animation: 'map-tutorial',
      tips: [
        'Tap on checkpoints to see details',
        'Watch your avatar move as you progress',
        'Track your XP and completion percentage',
      ],
    },
    {
      id: 'step_3',
      title: 'Earning Rewards',
      description: 'As you complete lessons and reach checkpoints, you\'ll unlock rewards including new lessons, cultural trivia, and badges.',
      animation: 'rewards',
      tips: [
        'Collect badges for achievements',
        'Unlock cultural trivia about Maharashtra',
        'Share your progress with friends',
      ],
    },
    {
      id: 'step_4',
      title: 'Ready to Start!',
      description: 'You\'re all set to begin your Marathi learning journey. Complete your first lesson to start earning XP and making progress!',
      animation: 'start-journey',
      tips: [
        'Start with basic greetings',
        'Practice pronunciation with speech recognition',
        'Learn at your own pace',
      ],
    },
  ];

  React.useEffect(() => {
    animateEntrance();
  }, [currentStep]);

  const animateEntrance = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({ x: width * (currentStep + 1), animated: true });
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      scrollViewRef.current?.scrollTo({ x: width * (currentStep - 1), animated: true });
    }
  };

  const handleComplete = () => {
    router.replace('/dashboard');
  };

  const handleSkip = () => {
    router.replace('/dashboard');
  };

  const renderStep = (step: TutorialStep, index: number) => {
    const isCurrentStep = index === currentStep;

    return (
      <View key={step.id} style={[styles.stepContainer, { width }]}>
        <Animated.View
          style={[
            styles.stepContent,
            {
              opacity: isCurrentStep ? fadeAnim : 0.3,
              transform: [{ translateY: isCurrentStep ? slideAnim : 0 }],
            },
          ]}
        >
          {/* Animation */}
          <View style={styles.animationContainer}>
            <LottieView
              source={require(`../../assets/animations/${step.animation}.json`)}
              autoPlay={isCurrentStep}
              loop={isCurrentStep}
              style={styles.animation}
            />
          </View>

          {/* Title and Description */}
          <View style={styles.textContainer}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDescription}>{step.description}</Text>
          </View>

          {/* Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Tips:</Text>
            {step.tips.map((tip, tipIndex) => (
              <View key={tipIndex} style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {tutorialSteps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentStep && styles.activeDot,
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Journey Tutorial</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tutorial Content */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentStep(newIndex);
        }}
      >
        {tutorialSteps.map((step, index) => renderStep(step, index))}
      </ScrollView>

      {/* Pagination */}
      {renderPagination()}

      {/* Navigation Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.previousButton,
            currentStep === 0 && styles.disabledButton,
          ]}
          onPress={handlePrevious}
          disabled={currentStep === 0}
        >
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={handleNext}
        >
          <Text style={styles.navButtonText}>
            {currentStep === tutorialSteps.length - 1 ? 'Start Learning!' : 'Next'}
          </Text>
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
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'OpenSans-Regular',
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
    width: 60,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  stepContent: {
    width: '100%',
    alignItems: 'center',
  },
  animationContainer: {
    width: 250,
    height: 250,
    marginBottom: 24,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    width: '100%',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Poppins-Bold',
  },
  stepDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'OpenSans-Regular',
  },
  tipsContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 12,
    fontFamily: 'Poppins-Bold',
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 16,
    color: '#FF6B35',
    marginRight: 8,
    fontWeight: 'bold',
  },
  tipText: {
    fontSize: 14,
    color: '#333333',
    flex: 1,
    lineHeight: 20,
    fontFamily: 'OpenSans-Regular',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FF6B35',
    width: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  previousButton: {
    backgroundColor: '#F5F5F5',
  },
  nextButton: {
    backgroundColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    fontFamily: 'Poppins-Bold',
  },
});

export default JourneyTutorialScreen;