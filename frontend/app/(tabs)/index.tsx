import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Platform
} from "react-native";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { createAlert } from "../../services/api";
import { useUser } from '../../context/UserContext';
import { useRouter } from 'expo-router';

interface Coords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

const { width } = Dimensions.get('window');

export default function IndexScreen() {
  const [location, setLocation] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const { user, clearUser } = useUser();
  const router = useRouter();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for alert button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Location permission is required for emergency services.");
          setLocationLoading(false);
          return;
        }
        
        const loc = await Location.getCurrentPositionAsync({ 
          accuracy: Location.Accuracy.High 
        });
        
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy ?? undefined,
        });
        setLocationLoading(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.warn("Location error:", error);
        Alert.alert("Location Error", "Unable to get your location. Please check your settings.");
        setLocationLoading(false);
      }
    })();
  }, []);

  const triggerAlert = async () => {
    if (!location) {
      Alert.alert("Location Required", "We need your location to send an emergency alert.");
      return;
    }

    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    try {
      const res = await createAlert({
        userId: (user && (((user as any).id) || (user as any).userId || (user as any).uid)) || 'UNKNOWN_USER',
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        message: "Emergency alert triggered from mobile app!",
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "✓ Alert Sent", 
        "Emergency services have been notified of your location.",
        [{ text: "OK", style: "default" }]
      );
      console.log("Alert response:", res.data);
    } catch (error) {
      console.error("Network Error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Failed to Send Alert", 
        "Unable to send emergency alert. Please try again.",
        [{ text: "OK", style: "cancel" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await clearUser();
              router.replace('/login');
            } catch (e) {
              console.warn(e);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          }
        }
      ]
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.content,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.userName}>{(user as any)?.name || "User"}</Text>
              </View>
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Text style={styles.logoutIcon}>👋</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.appTitleContainer}>
              <Text style={styles.appIcon}>🛡️</Text>
              <Text style={styles.appTitle}>AI Student Safety</Text>
            </View>
          </View>

          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>System Status</Text>
              <View style={[styles.statusBadge, location && styles.statusBadgeActive]}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>
                  {location ? "Active" : "Connecting..."}
                </Text>
              </View>
            </View>

            {/* Location Info */}
            <View style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationTitle}>Current Location</Text>
              </View>
              
              {locationLoading ? (
                <View style={styles.locationLoading}>
                  <ActivityIndicator color="#3B82F6" />
                  <Text style={styles.locationLoadingText}>Acquiring GPS signal...</Text>
                </View>
              ) : location ? (
                <View style={styles.locationDetails}>
                  <Text style={styles.locationCoords}>
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </Text>
                  {location.accuracy && (
                    <Text style={styles.locationAccuracy}>
                      Accuracy: ±{Math.round(location.accuracy)}m
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.locationError}>Location unavailable</Text>
              )}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/map')}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconContainer}>
                <Text style={styles.actionIcon}>🗺️</Text>
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>View Map</Text>
                <Text style={styles.actionDesc}>See your location on map</Text>
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/emergency-contacts')}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconContainer}>
                <Text style={styles.actionIcon}>📞</Text>
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Emergency Contacts</Text>
                <Text style={styles.actionDesc}>Manage your contacts</Text>
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Features Grid */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Safety Features</Text>
            <View style={styles.featuresGrid}>
              <View style={styles.featureCard}>
                <Text style={styles.featureIcon}>🤖</Text>
                <Text style={styles.featureTitle}>AI Fall Detection</Text>
                <Text style={styles.featureDesc}>Automatic alerts</Text>
              </View>

              <View style={styles.featureCard}>
                <Text style={styles.featureIcon}>📱</Text>
                <Text style={styles.featureTitle}>Real-time Tracking</Text>
                <Text style={styles.featureDesc}>Live location</Text>
              </View>

              <View style={styles.featureCard}>
                <Text style={styles.featureIcon}>🚨</Text>
                <Text style={styles.featureTitle}>Instant Alerts</Text>
                <Text style={styles.featureDesc}>Emergency response</Text>
              </View>

              <View style={styles.featureCard}>
                <Text style={styles.featureIcon}>🔒</Text>
                <Text style={styles.featureTitle}>Secure</Text>
                <Text style={styles.featureDesc}>Privacy protected</Text>
              </View>
            </View>
          </View>

          {/* Emergency Alert Button */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[styles.alertButton, loading && styles.alertButtonDisabled]}
              onPress={triggerAlert}
              disabled={loading || !location}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="large" />
              ) : (
                <>
                  <Text style={styles.alertIcon}>🚨</Text>
                  <Text style={styles.alertButtonText}>EMERGENCY ALERT</Text>
                  <Text style={styles.alertButtonSubtext}>
                    {location ? "Tap to notify emergency services" : "Waiting for location..."}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>How it works</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>1.</Text>
              <Text style={styles.infoText}>AI monitors your movement patterns continuously</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>2.</Text>
              <Text style={styles.infoText}>Automatic alerts trigger if a fall is detected</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>3.</Text>
              <Text style={styles.infoText}>Emergency contacts receive your location instantly</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F2937",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },

  // Header
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  logoutButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIcon: {
    fontSize: 24,
  },
  appTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  appIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#60A5FA',
  },

  // Status Card
  statusCard: {
    backgroundColor: '#374151',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },

  // Location Card
  locationCard: {
    backgroundColor: '#4B5563',
    borderRadius: 12,
    padding: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  locationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  locationLoadingText: {
    marginLeft: 12,
    fontSize: 13,
    color: '#D1D5DB',
  },
  locationDetails: {
    paddingTop: 4,
  },
  locationCoords: {
    fontSize: 15,
    color: '#E5E7EB',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 6,
  },
  locationAccuracy: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  locationError: {
    fontSize: 13,
    color: '#EF4444',
  },

  // Quick Actions
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4B5563',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  actionArrow: {
    fontSize: 28,
    color: '#6B7280',
    fontWeight: '300',
  },

  // Features Section
  featuresSection: {
    marginBottom: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: (width - 52) / 2,
    backgroundColor: '#374151',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F9FAFB',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Alert Button
  alertButton: {
    backgroundColor: '#DC2626',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  alertButtonDisabled: {
    opacity: 0.6,
  },
  alertIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  alertButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  alertButtonSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },

  // Info Section
  infoSection: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#60A5FA',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoBullet: {
    fontSize: 14,
    fontWeight: '700',
    color: '#60A5FA',
    width: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },
});