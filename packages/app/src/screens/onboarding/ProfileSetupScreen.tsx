import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase, completeAgeVerification, verifyAge } from '@marathi-learning/shared';
import LottieView from 'lottie-react-native';

interface RouteParams {
  selectedCity: {
    id: string;
    name: string;
    marathiName: string;
  };
  selectedAvatar: {
    id: string;
    name: string;
    imageUrl: string;
  };
}

const ProfileSetupScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ selectedCityJson?: string; selectedAvatarJson?: string }>();
  const selectedCity = params.selectedCityJson ? JSON.parse(params.selectedCityJson) : null;
  const selectedAvatar = params.selectedAvatarJson ? JSON.parse(params.selectedAvatarJson) : null;
  
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ displayName?: string; age?: string }>({});

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const validateForm = () => {
    const newErrors: { displayName?: string; age?: string } = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (displayName.trim().length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    } else if (displayName.trim().length > 20) {
      newErrors.displayName = 'Display name must be less than 20 characters';
    }

    if (!age.trim()) {
      newErrors.age = 'Age is required';
    } else {
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 5 || ageNum > 100) {
        newErrors.age = 'Please enter a valid age (5-100)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartJourney = async () => {
    if (!validateForm()) return;

    if (!selectedCity || !selectedAvatar) {
      Alert.alert('Error', 'Missing required information. Please go back and select your city and avatar.');
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Complete age verification and save profile
      const ageNum = parseInt(age);
      const { requiresParentalConsent } = verifyAge(ageNum);
      await completeAgeVerification(user.id, ageNum, 'learner');

      // Update display name and starting city
      await supabase.from('users').update({
        name: displayName.trim(),
        under_13: requiresParentalConsent,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);

      router.replace('/onboarding/tutorial');
    } catch (error) {
      console.error('Error starting journey:', error);
      Alert.alert('Error', 'Failed to start your journey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Complete Your Profile</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '75%' }]} />
          </View>
          <Text style={styles.progressText}>Step 3 of 4</Text>
        </View>

        {/* Avatar Preview */}
        <View style={styles.avatarPreview}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <Text style={styles.avatarName}>{selectedAvatar?.name || 'Your Avatar'}</Text>
        </View>

        {/* Journey Summary */}
        <View style={styles.journeySummary}>
          <Text style={styles.summaryTitle}>Your Journey Summary</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Starting City:</Text>
            <Text style={styles.summaryValue}>
              {selectedCity?.name} ({selectedCity?.marathiName})
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Destination:</Text>
            <Text style={styles.summaryValue}>Pune (पुणे)</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Avatar:</Text>
            <Text style={styles.summaryValue}>{selectedAvatar?.name}</Text>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Tell Us About Yourself</Text>

          {/* Display Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Display Name *</Text>
            <TextInput
              style={[
                styles.input,
                errors.displayName ? styles.inputError : undefined,
              ]}
              placeholder="Enter your display name"
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={20}
              autoCapitalize="words"
            />
            {errors.displayName && (
              <Text style={styles.errorText}>{errors.displayName}</Text>
            )}
          </View>

          {/* Age */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Age *</Text>
            <TextInput
              style={[
                styles.input,
                errors.age ? styles.inputError : undefined,
              ]}
              placeholder="Enter your age"
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              maxLength={3}
            />
            {errors.age && (
              <Text style={styles.errorText}>{errors.age}</Text>
            )}
          </View>

          {/* COPPA Notice */}
          <View style={styles.coppaNotice}>
            <Text style={styles.coppaTitle}>🔒 Privacy Notice</Text>
            <Text style={styles.coppaText}>
              We take your privacy seriously. Your information is protected and will never be shared with third parties. 
              If you're under 13, parental consent is required.
            </Text>
          </View>
        </View>

        {/* Start Journey Button */}
        <TouchableOpacity
          style={[
            styles.startButton,
            loading && styles.disabledButton,
          ]}
          onPress={handleStartJourney}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.startButtonText}>Start Your Journey! 🚀</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
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
  progressContainer: {
    padding: 20,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'OpenSans-Regular',
  },
  avatarPreview: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  avatarEmoji: {
    fontSize: 48,
  },
  avatarName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    fontFamily: 'Poppins-Bold',
  },
  journeySummary: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    fontFamily: 'Poppins-Bold',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'OpenSans-Regular',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    fontFamily: 'Poppins-SemiBold',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
    fontFamily: 'Poppins-Bold',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    fontFamily: 'OpenSans-Regular',
  },
  inputError: {
    borderColor: '#FF5252',
  },
  errorText: {
    fontSize: 12,
    color: '#FF5252',
    marginTop: 4,
    fontFamily: 'OpenSans-Regular',
  },
  coppaNotice: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  coppaTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 4,
    fontFamily: 'Poppins-Bold',
  },
  coppaText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
    fontFamily: 'OpenSans-Regular',
  },
  startButton: {
    backgroundColor: '#FF6B35',
    margin: 16,
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
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
});

export default ProfileSetupScreen;