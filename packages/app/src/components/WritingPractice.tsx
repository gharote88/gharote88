import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Svg, Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface WritingExercise {
  id: string;
  type: 'character' | 'word' | 'sentence';
  targetText: string;
  transliteration: string;
  englishMeaning: string;
  audioUrl: string;
  hint?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
  orderIndex: number;
}

interface WritingPracticeProps {
  exercise: WritingExercise;
  onComplete: (score: number) => void;
  onNext: () => void;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
}

const WritingPractice: React.FC<WritingPracticeProps> = ({ exercise, onComplete, onNext }) => {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasWritten, setHasWritten] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const canvasRef = useRef<View>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const playAudio = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: exercise.audioUrl },
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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        setIsDrawing(true);
        const point = { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY };
        setCurrentStroke([point]);
      },
      onPanResponderMove: (event) => {
        if (!isDrawing) return;
        const point = { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY };
        setCurrentStroke(prev => [...prev, point]);
      },
      onPanResponderRelease: () => {
        if (currentStroke.length > 0) {
          setStrokes(prev => [...prev, { points: currentStroke }]);
          setHasWritten(true);
        }
        setIsDrawing(false);
        setCurrentStroke([]);
      },
    })
  ).current;

  const clearCanvas = () => {
    setStrokes([]);
    setCurrentStroke([]);
    setHasWritten(false);
    setScore(null);
    setFeedback('');
  };

  const undoLastStroke = () => {
    if (strokes.length > 0) {
      setStrokes(prev => prev.slice(0, -1));
      if (strokes.length === 1) {
        setHasWritten(false);
      }
    }
  };

  const evaluateWriting = async () => {
    if (strokes.length === 0) {
      Alert.alert('No Writing', 'Please write something before evaluating');
      return;
    }

    try {
      // Calculate score based on stroke analysis
      const calculatedScore = calculateWritingScore();
      setScore(calculatedScore);
      setFeedback(generateWritingFeedback(calculatedScore));
      onComplete(calculatedScore);
    } catch (error) {
      console.error('Error evaluating writing:', error);
      Alert.alert('Error', 'Failed to evaluate writing');
    }
  };

  const calculateWritingScore = (): number => {
    // Simplified scoring algorithm
    // In production, use more sophisticated handwriting recognition
    
    const expectedStrokes = getExpectedStrokeCount(exercise.targetText);
    const actualStrokes = strokes.length;
    
    // Score based on stroke count similarity
    const strokeScore = Math.max(0, 100 - Math.abs(expectedStrokes - actualStrokes) * 10);
    
    // Score based on stroke complexity
    const complexityScore = calculateComplexityScore();
    
    // Average the scores
    return Math.round((strokeScore + complexityScore) / 2);
  };

  const getExpectedStrokeCount = (text: string): number => {
    // Simplified stroke count estimation
    // In production, use actual Devanagari stroke data
    if (exercise.type === 'character') {
      return 2; // Average strokes per character
    } else if (exercise.type === 'word') {
      return text.length * 2; // Approximate
    } else {
      return text.length * 2 + 5; // Add some for spaces
    }
  };

  const calculateComplexityScore = (): number => {
    if (strokes.length === 0) return 0;
    
    let totalPoints = 0;
    strokes.forEach(stroke => {
      totalPoints += stroke.points.length;
    });
    
    const averagePointsPerStroke = totalPoints / strokes.length;
    
    // Ideal range is 10-30 points per stroke
    if (averagePointsPerStroke >= 10 && averagePointsPerStroke <= 30) {
      return 100;
    } else if (averagePointsPerStroke >= 5 && averagePointsPerStroke <= 40) {
      return 80;
    } else {
      return 60;
    }
  };

  const generateWritingFeedback = (score: number): string => {
    if (score >= 90) {
      return 'Excellent! Your handwriting is perfect.';
    } else if (score >= 70) {
      return 'Great job! Your handwriting is very good.';
    } else if (score >= 50) {
      return 'Good effort! Keep practicing to improve your handwriting.';
    } else {
      return 'Keep practicing! Try to follow the stroke order more carefully.';
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

  const renderStroke = (stroke: Stroke, index: number) => {
    if (stroke.points.length < 2) return null;

    const path = stroke.points.map((point, i) => {
      if (i === 0) {
        return `M ${point.x} ${point.y}`;
      }
      return `L ${point.x} ${point.y}`;
    }).join(' ');

    return (
      <svg key={index} height="100%" width="100%" style={styles.svg}>
        <path
          d={path}
          stroke="#4CAF50"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const renderCurrentStroke = () => {
    if (currentStroke.length < 2) return null;

    const path = currentStroke.map((point, i) => {
      if (i === 0) {
        return `M ${point.x} ${point.y}`;
      }
      return `L ${point.x} ${point.y}`;
    }).join(' ');

    return (
      <svg height="100%" width="100%" style={styles.svg}>
        <path
          d={path}
          stroke="#4CAF50"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <View style={styles.container}>
      {/* Target Display */}
      <View style={styles.targetDisplay}>
        <Text style={styles.targetLabel}>Write this:</Text>
        <Text style={styles.targetText}>{exercise.targetText}</Text>
        <Text style={styles.transliteration}>{exercise.transliteration}</Text>
        <Text style={styles.englishMeaning}>{exercise.englishMeaning}</Text>
        
        <TouchableOpacity
          style={styles.audioButton}
          onPress={playAudio}
          disabled={isPlaying}
        >
          <Ionicons 
            name={isPlaying ? "volume-high" : "play-outline"} 
            size={24} 
            color="#4CAF50" 
          />
        </TouchableOpacity>
      </View>

      {/* Hint */}
      {exercise.hint && (
        <TouchableOpacity
          style={styles.hintButton}
          onPress={() => setShowHint(!showHint)}
        >
          <Ionicons name="information-circle-outline" size={20} color="#666" />
          <Text style={styles.hintButtonText}>
            {showHint ? 'Hide Hint' : 'Show Hint'}
          </Text>
        </TouchableOpacity>
      )}

      {showHint && exercise.hint && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>{exercise.hint}</Text>
        </View>
      )}

      {/* Canvas */}
      <View style={styles.canvasContainer}>
        <View
          ref={canvasRef}
          style={styles.canvas}
          {...panResponder.panHandlers}
        >
          {/* Grid lines for guidance */}
          <View style={styles.gridLines}>
            <View style={[styles.gridLine, styles.horizontalLine]} />
            <View style={[styles.gridLine, styles.verticalLine]} />
          </View>

          {/* Render completed strokes */}
          {strokes.map((stroke, index) => renderStroke(stroke, index))}
          
          {/* Render current stroke */}
          {renderCurrentStroke()}
        </View>

        {/* Canvas Controls */}
        <View style={styles.canvasControls}>
          <TouchableOpacity
            style={styles.canvasControlButton}
            onPress={undoLastStroke}
            disabled={strokes.length === 0}
          >
            <Ionicons 
              name="arrow-undo" 
              size={20} 
              color={strokes.length > 0 ? "#333" : "#ccc"} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.canvasControlButton}
            onPress={clearCanvas}
            disabled={strokes.length === 0}
          >
            <Ionicons 
              name="trash-outline" 
              size={20} 
              color={strokes.length > 0 ? "#F44336" : "#ccc"} 
            />
          </TouchableOpacity>
        </View>
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

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.evaluateButton]}
          onPress={evaluateWriting}
          disabled={!hasWritten}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Check Writing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton, 
            styles.nextButton,
            (!hasWritten || score === null) && styles.nextButtonDisabled
          ]}
          onPress={onNext}
          disabled={!hasWritten || score === null}
        >
          <Text style={styles.actionButtonText}>
            {score !== null ? 'Next Exercise' : 'Complete Writing First'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>Instructions:</Text>
        <Text style={styles.instructionText}>
          • Use your finger to write the {exercise.type} above
        </Text>
        <Text style={styles.instructionText}>
          • Follow the correct stroke order for better results
        </Text>
        <Text style={styles.instructionText}>
          • Tap "Check Writing" to evaluate your handwriting
        </Text>
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
  targetDisplay: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  targetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  targetText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  transliteration: {
    fontSize: 20,
    color: '#4CAF50',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  englishMeaning: {
    fontSize: 18,
    color: '#666',
    marginBottom: 12,
  },
  audioButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  hintButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  hintContainer: {
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  hintText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  canvasContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  canvas: {
    height: 300,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#e0e0e0',
  },
  horizontalLine: {
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
  },
  verticalLine: {
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  canvasControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  canvasControlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  scoreSection: {
    marginBottom: 16,
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  evaluateButton: {
    backgroundColor: '#4CAF50',
  },
  nextButton: {
    backgroundColor: '#2196F3',
  },
  nextButtonDisabled: {
    backgroundColor: '#ccc',
    elevation: 0,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  instructions: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default WritingPractice;