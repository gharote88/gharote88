import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

const WelcomeScreen: React.FC = () => {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    router.push('/onboarding/city-selection');
  };

  return (
    <View style={styles.container}>
      {/* Background animation */}
      <LottieView
        source={require('../../assets/animations/maharashtra-map.json')}
        autoPlay
        loop
        style={styles.backgroundAnimation}
      />

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Logo/Title */}
        <View style={styles.header}>
          <LottieView
            source={require('../../assets/animations/logo.json')}
            autoPlay
            loop
            style={styles.logoAnimation}
          />
          <Text style={styles.title}>Marathi Learning Journey</Text>
          <Text style={styles.subtitle}>Explore Maharashtra while learning Marathi</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🗺️</Text>
            <Text style={styles.featureText}>Interactive Journey Map</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🎯</Text>
            <Text style={styles.featureText}>Gamified Learning</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🏆</Text>
            <Text style={styles.featureText}>Earn Rewards & Badges</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🎤</Text>
            <Text style={styles.featureText}>Speech Recognition</Text>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>

        {/* Skip option */}
        <TouchableOpacity style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B35',
  },
  backgroundAnimation: {
    position: 'absolute',
    width: width,
    height: height,
    opacity: 0.3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoAnimation: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    fontFamily: 'OpenSans-Regular',
  },
  features: {
    width: '100%',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
    fontFamily: 'Poppins-Bold',
  },
  skipButton: {
    marginTop: 20,
    padding: 10,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
    fontFamily: 'OpenSans-Regular',
  },
});

export default WelcomeScreen;