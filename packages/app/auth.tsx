import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithGoogle, verifyAge } from '@marathi-learning/shared';

export default function AuthScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [age, setAge] = useState('');
  const [role, setRole] = useState<'learner' | 'parent'>('learner');

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      // Supabase OAuth redirects — on return, onAuthStateChange fires
      // and the session is picked up automatically
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleAgeSubmit = () => {
    if (!age) { Alert.alert('Error', 'Please enter your age'); return; }
    const { isValid, requiresParentalConsent, message } = verifyAge(parseInt(age));
    if (!isValid) { Alert.alert('Age Verification Failed', message); return; }
    if (requiresParentalConsent) {
      Alert.alert('Parental Consent Required', message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => router.replace('/onboarding') },
      ]);
    } else {
      router.replace('/onboarding');
    }
  };

  if (showAgeVerification) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>One More Step</Text>
          <Text style={styles.subtitle}>Please enter your age to continue</Text>
          <View style={styles.roleSelector}>
            {(['learner', 'parent'] as const).map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.roleButton, role === r && styles.roleButtonActive]}
                onPress={() => setRole(r)}
              >
                <Text style={[styles.roleButtonText, role === r && styles.roleButtonTextActive]}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Your age"
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            maxLength={3}
            autoFocus
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleAgeSubmit}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowAgeVerification(false)}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        <Text style={styles.title}>मराठी शिका</Text>
        <Text style={styles.titleEn}>Learn Marathi</Text>
        <Text style={styles.subtitle}>Start your journey across Maharashtra</Text>

        <View style={styles.features}>
          {[
            { emoji: '🗺️', text: 'Interactive Journey Map' },
            { emoji: '🎯', text: 'Gamified Learning' },
            { emoji: '🏆', text: 'Earn Rewards & Badges' },
            { emoji: '🎤', text: 'Speech Practice' },
          ].map(f => (
            <View key={f.text} style={styles.featureItem}>
              <Text style={styles.featureEmoji}>{f.emoji}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#333333" />
            : <Text style={styles.googleButtonText}>🔵  Continue with Google</Text>
          }
        </TouchableOpacity>

        <View style={styles.coppaNotice}>
          <Text style={styles.coppaNoticeText}>
            For users under 13, parental consent is required (COPPA / UK GDPR Children's Code).
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FF6B35' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 40 },
  content: { paddingHorizontal: 30, alignItems: 'center' },
  title: { fontSize: 40, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  titleEn: { fontSize: 22, fontWeight: '600', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#FFFFFF', textAlign: 'center', opacity: 0.9, marginBottom: 40 },
  features: { width: '100%', marginBottom: 40 },
  featureItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 16, borderRadius: 12, marginBottom: 12,
  },
  featureEmoji: { fontSize: 24, marginRight: 12 },
  featureText: { fontSize: 16, color: '#FFFFFF', fontWeight: '600' },
  googleButton: {
    backgroundColor: '#FFFFFF', paddingVertical: 16,
    paddingHorizontal: 24, borderRadius: 30,
    width: '100%', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
  },
  googleButtonText: { fontSize: 16, fontWeight: 'bold', color: '#333333' },
  coppaNotice: {
    marginTop: 24, padding: 12,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10,
  },
  coppaNoticeText: { fontSize: 12, color: '#FFFFFF', textAlign: 'center', lineHeight: 18 },
  // Age verification styles
  input: {
    width: '100%', backgroundColor: '#F5F5F5',
    paddingVertical: 15, paddingHorizontal: 20,
    borderRadius: 10, fontSize: 16,
    borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 16,
  },
  roleSelector: { flexDirection: 'row', gap: 10, marginBottom: 20, width: '100%' },
  roleButton: {
    flex: 1, paddingVertical: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF', alignItems: 'center',
  },
  roleButtonActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  roleButtonText: { color: '#333333', fontSize: 16, fontWeight: '600' },
  roleButtonTextActive: { color: '#FFFFFF' },
  primaryButton: {
    backgroundColor: '#FF6B35', paddingVertical: 15,
    borderRadius: 10, alignItems: 'center', width: '100%', marginBottom: 12,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: {
    backgroundColor: '#FFFFFF', paddingVertical: 15,
    borderRadius: 10, alignItems: 'center', width: '100%',
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  secondaryButtonText: { color: '#333333', fontSize: 16, fontWeight: '600' },
});
