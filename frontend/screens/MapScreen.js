// screens/MapScreen.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TouchableOpacity, 
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
  Platform
} from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import * as Location from "expo-location";
import { Accelerometer } from "expo-sensors";
import * as Haptics from "expo-haptics";
// Note: avoid importing `expo-notifications` at module scope to prevent
// automatic device push registration side-effects in Expo Go during route
// discovery. Import dynamically where needed.

import { createAlert, updateToken } from "../services/api";
import { registerForPushNotificationsAsync } from "../utils/notificationsClient";
import { useUser } from "../context/UserContext";

import createWindowedFallDetector from "../utils/fallDetection";
import FallDebugPanel from "../components/FallDebugPanel";
import FallGraph from "../components/FallGraph";

const { width } = Dimensions.get('window');

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [sending, setSending] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState(null);

  const [debugScores, setDebugScores] = useState(null);
  const [debugProb, setDebugProb] = useState(null);
  const [probHistory, setProbHistory] = useState([]);

  const accelSubRef = useRef(null);
  const fallDetectorRef = useRef(null);
  const autoAlertTimerRef = useRef(null);
  const lastAlertAtRef = useRef(0);
  const cooldownMs = 5000;

  const mountedRef = useRef(true);
  const tokenSentRef = useRef(false);

  const { user } = useUser();
  const userIdForAlerts = user?.id || user?.userId || user?.uid || null;

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const panicButtonScale = useRef(new Animated.Value(1)).current;

  // Pulse animation for panic button
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Register push token & send to backend
  useEffect(() => {
    mountedRef.current = true;
    let notificationListenerSub = null;

    const registerAndSend = async () => {
      if (!userIdForAlerts) {
        console.log("MapScreen: no userId yet, skipping push registration");
        return;
      }

      if (tokenSentRef.current) {
        console.log("MapScreen: token already sent to backend, skipping");
        return;
      }

      try {
        const token = await registerForPushNotificationsAsync();
        if (!token) {
          console.warn("MapScreen: no push token returned");
          return;
        }
        console.log("Expo Push Token:", token);

        let loc = location;
        if (!loc) {
          try {
            const pos = await Location.getCurrentPositionAsync({});
            if (pos?.coords) {
              loc = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              };
              if (mountedRef.current) {
                setLocation({
                  ...loc,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                });
                setLocationAccuracy(pos.coords.accuracy);
              }
            }
          } catch (locErr) {
            console.warn("MapScreen: failed to get location", locErr.message || locErr);
          }
        }

        await updateToken({
          userId: userIdForAlerts,
          deviceToken: token,
          location: loc || null,
        });

        tokenSentRef.current = true;
        console.log("✔ deviceToken + location sent to backend");
      } catch (err) {
        console.error("updateToken error:", err?.message || err);
      }
    };

    registerAndSend();

    // dynamically import notifications to attach listener, but skip in Expo Go
    (async () => {
      try {
        const Constants = await import('expo-constants');
        if (Constants?.appOwnership === 'expo') {
          // Expo Go doesn't support remote push; skip listener registration
          console.warn('Expo Go detected — skipping notification listener.');
          return;
        }

        const Notifications = await import('expo-notifications');
        notificationListenerSub = Notifications.addNotificationReceivedListener((notif) => {
          console.log('📩 Notification received:', notif);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        });
      } catch (e) {
        console.warn('Notifications not available in this environment', e);
      }
    })();

    return () => {
      mountedRef.current = false;
      try { notificationListenerSub?.remove?.(); } catch (e) {}
    };
  }, [userIdForAlerts, location]);

  // Get location on start
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Location permission is required for emergency services.");
          return;
        }

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (loc && loc.coords && active) {
          setLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          setLocationAccuracy(loc.coords.accuracy);
          
          // Slide in location info
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }).start();
        }
      } catch (err) {
        console.warn("Location error:", err?.message || err);
        Alert.alert("Location Error", "Unable to fetch your location. Please check your settings.");
      }
    })();

    return () => { active = false; };
  }, []);

  // Fall detection
  useEffect(() => {
    Accelerometer.setUpdateInterval(80);

    fallDetectorRef.current = createWindowedFallDetector({
      threshold: 0.35,
      windowSize: 20,
      step: 4,
      minImpactFreefallSequence: true,
      onFall: (result) => {
        const prob = result?.probability ?? result?.prob ?? 0;
        setDebugProb(prob);
        setDebugScores(result?.scores ?? {});
        handleFallDetected();
      },
      cooldownMs: 4000,
    });

    const sub = Accelerometer.addListener((data) => {
      fallDetectorRef.current?.addSample?.({ ...data, t: Date.now() });
    });

    accelSubRef.current = sub;

    return () => {
      try { accelSubRef.current?.remove?.(); } catch (e) {}
      try { fallDetectorRef.current?.dispose?.(); } catch (e) {}
    };
  }, []);

  useEffect(() => {
    if (debugProb == null) return;
    setProbHistory((p) => [...p, debugProb].slice(-200));
  }, [debugProb]);

  // Fall alert handling
  const [autoAlertVisible, setAutoAlertVisible] = useState(false);
  const [autoCountdown, setAutoCountdown] = useState(0);
  const countdownAnim = useRef(new Animated.Value(1)).current;

  const handleFallDetected = useCallback(() => {
    const now = Date.now();
    if (autoAlertTimerRef.current) return;
    if (now - lastAlertAtRef.current <= cooldownMs) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setAutoAlertVisible(true);
    setAutoCountdown(3);

    // Countdown animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(countdownAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(countdownAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    autoAlertTimerRef.current = setInterval(() => {
      setAutoCountdown((c) => {
        if (c <= 1) {
          clearInterval(autoAlertTimerRef.current);
          autoAlertTimerRef.current = null;
          setAutoAlertVisible(false);
          lastAlertAtRef.current = Date.now();
          triggerAutoAlert();
          return 0;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        return c - 1;
      });
    }, 1000);
  }, []);

  const sendAlertToServer = useCallback(async (payload) => {
    setSending(true);
    try {
      await createAlert(payload);
      Alert.alert("✓ Alert Sent", "Emergency services have been notified of your location.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.warn("createAlert failed:", err?.message || err);
      Alert.alert("Failed", "Could not send alert. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSending(false);
    }
  }, []);

  const triggerAutoAlert = useCallback(async () => {
    if (!location) {
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (pos?.coords) {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
          setLocationAccuracy(pos.coords.accuracy);
        }
      } catch {}
    }

    const coords = location
      ? { latitude: location.latitude, longitude: location.longitude }
      : { latitude: 0, longitude: 0 };

    await sendAlertToServer({
      userId: userIdForAlerts,
      location: coords,
      message: "🚨 Emergency alert triggered by AI fall detection!",
    });
  }, [location, sendAlertToServer, userIdForAlerts]);

  const handleManualAlert = useCallback(async () => {
    if (!location) return Alert.alert("Error", "Location not available. Please wait...");

    const now = Date.now();
    if (now - lastAlertAtRef.current < cooldownMs) {
      return Alert.alert("Please Wait", `You can send another alert in ${Math.ceil((cooldownMs - (now - lastAlertAtRef.current)) / 1000)} seconds.`);
    }

    // Button press animation
    Animated.sequence([
      Animated.timing(panicButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(panicButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    lastAlertAtRef.current = now;

    await sendAlertToServer({
      userId: userIdForAlerts,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      message: "🚨 Panic alert triggered manually!",
    });
  }, [location, sendAlertToServer, userIdForAlerts]);

  const cancelAutoAlert = useCallback(() => {
    if (autoAlertTimerRef.current) {
      clearInterval(autoAlertTimerRef.current);
      autoAlertTimerRef.current = null;
    }
    setAutoAlertVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {location ? (
        <>
          <MapView 
            style={styles.map} 
            region={location}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={true}
            loadingEnabled={true}
          >
            <Marker 
              coordinate={location} 
              title="Your Location"
              description="You are here"
            >
              <View style={styles.markerContainer}>
                <View style={styles.markerDot} />
              </View>
            </Marker>
            
            {locationAccuracy && (
              <Circle
                center={location}
                radius={locationAccuracy}
                strokeColor="rgba(59, 130, 246, 0.3)"
                fillColor="rgba(59, 130, 246, 0.1)"
              />
            )}
          </MapView>

          {/* Location Info Card */}
          <Animated.View style={[styles.locationCard, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.locationCardContent}>
              <View style={styles.locationIcon}>
                <Text style={styles.locationIconText}>📍</Text>
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationTitle}>Current Location</Text>
                <Text style={styles.locationCoords}>
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </Text>
                {locationAccuracy && (
                  <Text style={styles.locationAccuracy}>
                    Accuracy: ±{Math.round(locationAccuracy)}m
                  </Text>
                )}
              </View>
              <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
            </View>
          </Animated.View>
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Acquiring your location...</Text>
          <Text style={styles.loadingSubtext}>This may take a few moments</Text>
        </View>
      )}

      {/* Panic Button */}
      <View style={styles.controls}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.panicButton, sending && styles.panicButtonDisabled]}
            disabled={sending || !location}
            onPress={handleManualAlert}
            activeOpacity={0.9}
          >
            <Animated.View style={{ transform: [{ scale: panicButtonScale }] }}>
              {sending ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <>
                  <Text style={styles.panicIcon}>🚨</Text>
                  <Text style={styles.panicText}>EMERGENCY</Text>
                  <Text style={styles.panicSubtext}>Tap to send alert</Text>
                </>
              )}
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Debug Panels */}
      <FallDebugPanel scores={debugScores} prob={debugProb} />
      <FallGraph probHistory={probHistory} />

      {/* Auto Alert Overlay */}
      {autoAlertVisible && (
        <View style={styles.overlay}>
          <View style={styles.overlayBackground} />
          <Animated.View style={[styles.alertBox, { transform: [{ scale: countdownAnim }] }]}>
            <View style={styles.alertHeader}>
              <Text style={styles.alertIcon}>⚠️</Text>
              <Text style={styles.alertTitle}>Fall Detected!</Text>
            </View>
            
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownNumber}>{autoCountdown}</Text>
              <Text style={styles.countdownText}>Sending emergency alert...</Text>
            </View>

            <View style={styles.alertActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelAutoAlert}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>I'm OK - Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.sendNowButton}
                onPress={() => {
                  cancelAutoAlert();
                  handleManualAlert();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.sendNowButtonText}>Send Now</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.alertFooter}>
              Emergency services will be notified of your location
            </Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  map: { 
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  
  // Location Card
  locationCard: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  locationCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationIconText: {
    fontSize: 24,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  locationAccuracy: {
    fontSize: 11,
    color: '#10B981',
    marginTop: 2,
    fontWeight: '500',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },

  // Custom Marker
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },

  // Panic Button
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  panicButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 6,
    borderColor: '#FFFFFF',
  },
  panicButtonDisabled: {
    opacity: 0.6,
  },
  panicIcon: {
    fontSize: 40,
    marginBottom: 4,
  },
  panicText: { 
    color: '#fff', 
    fontWeight: '800', 
    fontSize: 18,
    letterSpacing: 1,
  },
  panicSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },

  // Alert Overlay
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  alertBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 20,
  },
  alertHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  alertIcon: {
    fontSize: 60,
    marginBottom: 12,
  },
  alertTitle: { 
    color: '#111827', 
    fontSize: 24, 
    fontWeight: '800',
    textAlign: 'center',
  },
  countdownContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    marginBottom: 20,
  },
  countdownNumber: {
    fontSize: 72,
    fontWeight: '800',
    color: '#DC2626',
    lineHeight: 72,
  },
  countdownText: { 
    color: '#991B1B', 
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  alertActions: {
    gap: 12,
  },
  cancelButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: { 
    color: '#fff', 
    fontWeight: '700',
    fontSize: 16,
  },
  sendNowButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  sendNowButtonText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 16,
  },
  alertFooter: {
    marginTop: 16,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});