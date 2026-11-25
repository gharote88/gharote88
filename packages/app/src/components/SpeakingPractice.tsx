import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { supabase } from '../supabase';
import { initWhisper } from 'whisper.rn';
import type { WhisperContext } from 'whisper.rn';

// Bundled whisper tiny model — placed at assets/whisper/ggml-tiny.bin
// eslint-disable-next-line @typescript-eslint/no-var-requires
const WHISPER_MODEL_PATH: number = require('../../assets/whisper/ggml-tiny.bin') as number;

interface Phrase {
  id: string;
  marathiText: string;
  transliteration: string;
  englishMeaning: string;
  audioUrl: string;
  audioDuration: number;
  context: string;
  examples: string[];
}

interface SpeakingPracticeProps {
  phrase: Phrase;
  onComplete: (score: number) => void;
  onNext: () => void;
}

const SpeakingPractice: React.FC<SpeakingPracticeProps> = ({ phrase, onComplete, onNext }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const whisperRef = useRef<WhisperContext | null>(null);

  // Load Whisper model once on mount
  useEffect(() => {
    initWhisper({ filePath: WHISPER_MODEL_PATH })
      .then((ctx: WhisperContext) => { whisperRef.current = ctx; })
      .catch((e: Error) =>
        console.warn('Whisper model load failed (offline STT unavailable):', e.message)
      );
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
      }
    } catch (error) {
      console.error('Error cleaning up:', error);
    }
  };

  const playAudio = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: phrase.audioUrl },
        { shouldPlay: true }
      );
      
      soundRef.current = sound;
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Please grant microphone permission to practice speaking');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });
      
      recordingRef.current = recording;
      await recording.startAsync();
      setIsRecording(true);
      setHasRecorded(false);
      setScore(null);
      setFeedback('');
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      setIsRecording(false);
      setIsProcessing(true);

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      if (uri) {
        await evaluatePronunciation(uri);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
      setIsProcessing(false);
    }
  };

  // Web: use browser Web Speech API (free, no server call)
  const evaluateWithWebSpeech = (): Promise<string> =>
    new Promise((resolve, reject) => {
      type SpeechRecognitionCtor = new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: (e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void;
        onerror: (e: { error: string }) => void;
        start: () => void;
      };
      const SpeechRecognitionClass: SpeechRecognitionCtor | undefined =
        (window as Record<string, unknown>).SpeechRecognition as SpeechRecognitionCtor
        ?? (window as Record<string, unknown>).webkitSpeechRecognition as SpeechRecognitionCtor;
      if (!SpeechRecognitionClass) return reject(new Error('Web Speech API not supported'));
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'mr-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (e) => resolve(e.results[0][0].transcript);
      recognition.onerror = (e) => reject(new Error(e.error));
      recognition.start();
    });

  // Whisper offline STT fallback — runs fully on-device, supports Marathi (mr)
  const evaluateWithWhisper = async (audioUri: string): Promise<string> => {
    if (!whisperRef.current) throw new Error('Whisper model not loaded');
    const { result } = await whisperRef.current.transcribe(audioUri, {
      language: 'mr',
      maxLen: 1,
      tokenTimestamps: false,
    });
    return result.trim();
  };

  const evaluatePronunciation = async (audioUri: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const referenceId = `speech_${phrase.id}_${Date.now()}`;
      let transcript: string | null = null;

      // Web path: use Web Speech API directly
      const w = window as Record<string, unknown>;
      if (typeof window !== 'undefined' && (w.SpeechRecognition ?? w.webkitSpeechRecognition)) {
        try {
          transcript = await evaluateWithWebSpeech();
        } catch {
          // fall through to server path
        }
      }

      if (transcript) {
        // Send transcript to server for scoring only
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/speech?action=evaluate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
            body: JSON.stringify({ transcript, expectedPhrase: phrase.marathiText, referenceId }),
          }
        );
        const data = await res.json();
        setScore(data.score);
        setFeedback(generateFeedback(data.score));
        onComplete(data.score);
      } else {
        // Mobile path: try server (HF Whisper → Google STT fallback), then Whisper offline
        let data: { score: number } | null = null;
        try {
          const audioRes = await fetch(audioUri);
          const buffer = await audioRes.arrayBuffer();
          const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
          const res = await fetch(
            `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/speech?action=evaluate`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
              body: JSON.stringify({ audioData: audioBase64, expectedPhrase: phrase.marathiText, referenceId }),
            }
          );
          data = await res.json();
        } catch {
          // Server unreachable — fall back to Whisper on-device STT
          try {
            const whisperTranscript = await evaluateWithWhisper(audioUri);
            const res = await fetch(
              `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/speech?action=evaluate`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
                body: JSON.stringify({ transcript: whisperTranscript, expectedPhrase: phrase.marathiText, referenceId }),
              }
            );
            data = await res.json();
          } catch {
            data = { score: 0 };
          }
        }
        setScore(data.score);
        setFeedback(generateFeedback(data.score));
        onComplete(data.score);
      }
    } catch (error) {
      console.error('Error evaluating pronunciation:', error);
      Alert.alert('Error', 'Failed to evaluate pronunciation. Please try again.');
    } finally {
      setIsProcessing(false);
      setHasRecorded(true);
    }
  };

  const generateFeedback = (score: number): string => {
    if (score >= 90) {
      return 'Excellent! Your pronunciation is perfect.';
    } else if (score >= 70) {
      return 'Great job! Your pronunciation is very good.';
    } else if (score >= 50) {
      return 'Good effort! Keep practicing to improve.';
    } else {
      return 'Keep practicing! Listen to the audio again and try to match the pronunciation.';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Great';
    if (score >= 50) return 'Good';
    return 'Keep Practicing';
  };

  return (
    <View style={styles.container}>
      {/* Phrase Display */}
      <View style={styles.phraseDisplay}>
        <Text style={styles.marathiText}>{phrase.marathiText}</Text>
        <Text style={styles.transliteration}>{phrase.transliteration}</Text>
        <Text style={styles.englishMeaning}>{phrase.englishMeaning}</Text>
      </View>

      {/* Audio Playback */}
      <View style={styles.audioSection}>
        <TouchableOpacity
          style={[styles.playButton, isPlaying && styles.playButtonActive]}
          onPress={playAudio}
          disabled={isPlaying}
        >
          <Ionicons 
            name={isPlaying ? "volume-high" : "play-outline"} 
            size={32} 
            color="#fff" 
          />
        </TouchableOpacity>
        <Text style={styles.audioInstruction}>
          {isPlaying ? 'Playing...' : 'Tap to hear pronunciation'}
        </Text>
      </View>

      {/* Recording Section */}
      <View style={styles.recordingSection}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordButtonActive,
            isProcessing && styles.recordButtonDisabled
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size={32} color="#fff" />
          ) : (
            <Ionicons 
              name={isRecording ? "stop" : "mic"} 
              size={32} 
              color="#fff" 
            />
          )}
        </TouchableOpacity>
        
        <Text style={styles.recordingInstruction}>
          {isRecording ? 'Recording... Tap to stop' : 
           isProcessing ? 'Processing your pronunciation...' :
           hasRecorded ? 'Tap to record again' : 
           'Tap to record your pronunciation'}
        </Text>
      </View>

      {/* Score and Feedback */}
      {score !== null && (
        <View style={styles.scoreSection}>
          <View style={[styles.scoreCard, { borderColor: getScoreColor(score) }]}>
            <View style={styles.scoreHeader}>
              <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>
                {score}%
              </Text>
              <Text style={[styles.scoreLabel, { color: getScoreColor(score) }]}>
                {getScoreLabel(score)}
              </Text>
            </View>
            <Text style={styles.feedbackText}>{feedback}</Text>
          </View>
        </View>
      )}

      {/* Context and Examples */}
      <View style={styles.contextSection}>
        <Text style={styles.contextLabel}>Context:</Text>
        <Text style={styles.contextText}>{phrase.context}</Text>
        
        {phrase.examples.length > 0 && (
          <>
            <Text style={styles.examplesLabel}>Examples:</Text>
            {phrase.examples.map((example, index) => (
              <Text key={index} style={styles.exampleText}>• {example}</Text>
            ))}
          </>
        )}
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, !hasRecorded && styles.navButtonDisabled]}
          onPress={onNext}
          disabled={!hasRecorded}
        >
          <Text style={styles.navButtonText}>
            {hasRecorded ? 'Next Phrase' : 'Complete Recording First'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  phraseDisplay: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  marathiText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  transliteration: {
    fontSize: 20,
    color: '#4CAF50',
    fontStyle: 'italic',
    marginBottom: 8,
    textAlign: 'center',
  },
  englishMeaning: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  audioSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  playButtonActive: {
    backgroundColor: '#45a049',
  },
  audioInstruction: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  recordingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  recordButtonActive: {
    backgroundColor: '#d32f2f',
  },
  recordButtonDisabled: {
    backgroundColor: '#ccc',
    elevation: 0,
  },
  recordingInstruction: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  scoreSection: {
    marginBottom: 24,
  },
  scoreCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginRight: 12,
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  feedbackText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 22,
  },
  contextSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contextLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  contextText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    lineHeight: 22,
  },
  examplesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    lineHeight: 20,
  },
  navigation: {
    marginTop: 'auto',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  navButtonDisabled: {
    backgroundColor: '#ccc',
    elevation: 0,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default SpeakingPractice;