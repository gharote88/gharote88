import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../supabase';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

interface StartingCity {
  id: string;
  name: string;
  marathiName: string;
  description: string;
  distanceToPune: number;
  estimatedDuration: number;
  culturalHighlights: string[];
  imageUrl: string;
  position: { x: number; y: number };
}

const CitySelectionScreen: React.FC = () => {
  const router = useRouter();
  const [cities, setCities] = useState<StartingCity[]>([]);
  const [selectedCity, setSelectedCity] = useState<StartingCity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadCities();
    animateEntrance();
  }, []);

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadCities = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/journey/routes`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error('Failed to load cities');
      const data = await res.json();
      if (data.routes) setCities(data.routes);
      else setError('Failed to load cities');
    } catch (error) {
      console.error('Error loading cities:', error);
      setError('Failed to load cities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = (city: StartingCity) => {
    setSelectedCity(city);
    Animated.spring(scaleAnim, {
      toValue: 1.05,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleContinue = () => {
    if (selectedCity) {
      router.push({ pathname: '/onboarding/route-confirmation', params: { selectedCityJson: JSON.stringify(selectedCity) } });
    }
  };

  const renderCityCard = (city: StartingCity) => {
    const isSelected = selectedCity?.id === city.id;

    return (
      <TouchableOpacity
        key={city.id}
        style={[
          styles.cityCard,
          isSelected && styles.selectedCityCard,
        ]}
        onPress={() => handleCitySelect(city)}
        activeOpacity={0.7}
      >
        {/* City Image */}
        <View style={styles.cityImageContainer}>
          <Image
            source={{ uri: city.imageUrl }}
            style={styles.cityImage}
            defaultSource={require('../../assets/images/placeholder-city.png')}
          />
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>✓</Text>
            </View>
          )}
        </View>

        {/* City Info */}
        <View style={styles.cityInfo}>
          <Text style={styles.cityName}>{city.name}</Text>
          <Text style={styles.cityMarathiName}>{city.marathiName}</Text>
          <Text style={styles.cityDescription} numberOfLines={2}>
            {city.description}
          </Text>

          {/* Journey Details */}
          <View style={styles.journeyDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailEmoji}>📍</Text>
              <Text style={styles.detailText}>{city.distanceToPune} km to Pune</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailEmoji}>⏱️</Text>
              <Text style={styles.detailText}>{city.estimatedDuration} days</Text>
            </View>
          </View>

          {/* Cultural Highlights */}
          <View style={styles.highlightsContainer}>
            <Text style={styles.highlightsTitle}>Cultural Highlights:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {city.culturalHighlights.map((highlight, index) => (
                <View key={index} style={styles.highlightBadge}>
                  <Text style={styles.highlightText}>{highlight}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../../assets/animations/loading.json')}
          autoPlay
          loop
          style={styles.loadingAnimation}
        />
        <Text style={styles.loadingText}>Loading cities...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadCities}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Starting City</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Subtitle */}
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>
          Select where you'd like to begin your Marathi learning journey across Maharashtra
        </Text>
      </View>

      {/* Cities List */}
      <ScrollView
        style={styles.citiesList}
        contentContainerStyle={styles.citiesListContent}
        showsVerticalScrollIndicator={false}
      >
        {cities.map(renderCityCard)}
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedCity && styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={!selectedCity}
        >
          <Animated.Text
            style={[
              styles.continueButtonText,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            Continue with {selectedCity?.name || 'Selected City'}
          </Animated.Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
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
  subtitleContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'OpenSans-Regular',
  },
  citiesList: {
    flex: 1,
  },
  citiesListContent: {
    padding: 16,
    paddingBottom: 100,
  },
  cityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCityCard: {
    borderColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cityImageContainer: {
    height: 150,
    position: 'relative',
  },
  cityImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  selectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF6B35',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cityInfo: {
    padding: 16,
  },
  cityName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
    fontFamily: 'Poppins-Bold',
  },
  cityMarathiName: {
    fontSize: 16,
    color: '#FF6B35',
    marginBottom: 8,
    fontFamily: 'NotoSansDevanagari-Regular',
  },
  cityDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'OpenSans-Regular',
  },
  journeyDetails: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'OpenSans-Regular',
  },
  highlightsContainer: {
    marginTop: 8,
  },
  highlightsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
  },
  highlightBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  highlightText: {
    fontSize: 11,
    color: '#FF6B35',
    fontFamily: 'OpenSans-Regular',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  continueButton: {
    backgroundColor: '#FF6B35',
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
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingAnimation: {
    width: 200,
    height: 200,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
    fontFamily: 'OpenSans-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    fontSize: 16,
    color: '#FF5252',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'OpenSans-Regular',
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
});

export default CitySelectionScreen;