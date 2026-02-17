import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  Linking,
  Dimensions,
  Platform
} from 'react-native';

const { width } = Dimensions.get('window');

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  color: string;
  index: number;
}

interface ResourceCardProps {
  icon: string;
  title: string;
  description: string;
  link: string;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.featureCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.featureIconContainer, { backgroundColor: color }]}>
        <Text style={styles.featureIcon}>{icon}</Text>
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </Animated.View>
  );
};

const ResourceCard: React.FC<ResourceCardProps> = ({ icon, title, description, link, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = () => {
    Linking.openURL(link);
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        style={styles.resourceCard}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.resourceIconContainer}>
          <Text style={styles.resourceIcon}>{icon}</Text>
        </View>
        <View style={styles.resourceContent}>
          <Text style={styles.resourceTitle}>{title}</Text>
          <Text style={styles.resourceDescription}>{description}</Text>
        </View>
        <Text style={styles.resourceArrow}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ExploreScreen() {
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const features = [
    {
      icon: '🤖',
      title: 'AI Fall Detection',
      description: 'Advanced machine learning algorithms monitor your movements and automatically detect falls in real-time',
      color: 'rgba(59, 130, 246, 0.15)',
    },
    {
      icon: '📍',
      title: 'Location Tracking',
      description: 'High-precision GPS tracking ensures emergency services can locate you quickly and accurately',
      color: 'rgba(16, 185, 129, 0.15)',
    },
    {
      icon: '🚨',
      title: 'Emergency Alerts',
      description: 'Instant notifications sent to your emergency contacts with your exact location and status',
      color: 'rgba(239, 68, 68, 0.15)',
    },
    {
      icon: '📱',
      title: 'Real-time Monitoring',
      description: 'Continuous monitoring with low battery impact ensures you\'re always protected',
      color: 'rgba(245, 158, 11, 0.15)',
    },
  ];

  const resources = [
    {
      icon: '📚',
      title: 'Documentation',
      description: 'Learn how to use all features effectively',
      link: 'https://docs.expo.dev',
    },
    {
      icon: '🛠️',
      title: 'Safety Guidelines',
      description: 'Best practices for emergency situations',
      link: 'https://docs.expo.dev/router/introduction',
    },
    {
      icon: '💬',
      title: 'Support & FAQ',
      description: 'Get help and find answers to common questions',
      link: 'https://docs.expo.dev/develop/user-interface/color-themes/',
    },
    {
      icon: '🔒',
      title: 'Privacy Policy',
      description: 'How we protect your data and location',
      link: 'https://expo.dev/privacy',
    },
  ];

  const stats = [
    { value: '99.9%', label: 'Accuracy' },
    { value: '<3s', label: 'Response Time' },
    { value: '24/7', label: 'Monitoring' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.headerIcon}>🛡️</Text>
          <Text style={styles.headerTitle}>Explore Features</Text>
          <Text style={styles.headerSubtitle}>
            Discover how AI-powered safety technology keeps you protected
          </Text>
        </Animated.View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <Text style={styles.sectionSubtitle}>
            Advanced technology designed to keep students safe
          </Text>

          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              color={feature.color}
              index={index}
            />
          ))}
        </View>

        {/* How It Works Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepsContainer}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Continuous Monitoring</Text>
                <Text style={styles.stepDescription}>
                  AI analyzes movement patterns using your device's sensors
                </Text>
              </View>
            </View>

            <View style={styles.stepConnector} />

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Instant Detection</Text>
                <Text style={styles.stepDescription}>
                  Falls and emergencies are detected within milliseconds
                </Text>
              </View>
            </View>

            <View style={styles.stepConnector} />

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Automatic Alert</Text>
                <Text style={styles.stepDescription}>
                  Emergency contacts receive your location and alert
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Resources Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources & Support</Text>
          <Text style={styles.sectionSubtitle}>
            Learn more and get help when you need it
          </Text>

          {resources.map((resource, index) => (
            <ResourceCard
              key={index}
              icon={resource.icon}
              title={resource.title}
              description={resource.description}
              link={resource.link}
              index={index}
            />
          ))}
        </View>

        {/* Technology Stack */}
        <View style={styles.techSection}>
          <Text style={styles.techTitle}>Built With</Text>
          <View style={styles.techGrid}>
            <View style={styles.techBadge}>
              <Text style={styles.techText}>⚛️ React Native</Text>
            </View>
            <View style={styles.techBadge}>
              <Text style={styles.techText}>📱 Expo</Text>
            </View>
            <View style={styles.techBadge}>
              <Text style={styles.techText}>🤖 TensorFlow</Text>
            </View>
            <View style={styles.techBadge}>
              <Text style={styles.techText}>🗺️ Maps API</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ for student safety
          </Text>
          <Text style={styles.footerSubtext}>
            Version 1.0.0 • © 2025 AI Student Safety
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  statCard: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#60A5FA',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 20,
    lineHeight: 20,
  },

  // Feature Card
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureIcon: {
    fontSize: 32,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },

  // Steps
  stepsContainer: {
    marginTop: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  stepConnector: {
    width: 2,
    height: 24,
    backgroundColor: '#4B5563',
    marginLeft: 19,
    marginVertical: -10,
  },

  // Resource Card
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  resourceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#4B5563',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  resourceIcon: {
    fontSize: 24,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 2,
  },
  resourceDescription: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  resourceArrow: {
    fontSize: 28,
    color: '#6B7280',
    fontWeight: '300',
  },

  // Technology
  techSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  techTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 16,
  },
  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  techBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  techText: {
    fontSize: 14,
    color: '#E5E7EB',
    fontWeight: '600',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
});