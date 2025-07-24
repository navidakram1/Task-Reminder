import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'

const { width, height } = Dimensions.get('window')

export default function LandingScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>HomeTask</Text>
          <Text style={styles.heroSubtitle}>
            Manage chores & bills together
          </Text>
          <Text style={styles.heroDescription}>
            The easiest way to organize household tasks, split bills, and keep everyone accountable
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/signup')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.secondaryButtonText}>Login</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Why HomeTask?</Text>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>✓</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Smart Task Management</Text>
              <Text style={styles.featureDescription}>
                Create tasks with due dates, auto-shuffle chores for fairness, and set up recurring tasks
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>💰</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Bill Splitting Made Easy</Text>
              <Text style={styles.featureDescription}>
                Split bills equally or custom amounts, track who paid and who owes
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>🔔</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Smart Reminders</Text>
              <Text style={styles.featureDescription}>
                Get push and email notifications for tasks and bills
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>👥</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Task Approval System</Text>
              <Text style={styles.featureDescription}>
                Mark tasks as done and get verification from housemates
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.pricingSection}>
          <Text style={styles.sectionTitle}>Simple Pricing</Text>
          
          <View style={styles.pricingCards}>
            <View style={styles.pricingCard}>
              <Text style={styles.planName}>Free</Text>
              <Text style={styles.planPrice}>$0</Text>
              <Text style={styles.planDescription}>
                • Limited tasks & bills{'\n'}
                • Basic features{'\n'}
                • Ads supported
              </Text>
            </View>

            <View style={[styles.pricingCard, styles.popularCard]}>
              <Text style={styles.popularBadge}>POPULAR</Text>
              <Text style={styles.planName}>Lifetime</Text>
              <Text style={styles.planPrice}>$15</Text>
              <Text style={styles.planDescription}>
                • Unlimited everything{'\n'}
                • No ads{'\n'}
                • All premium features{'\n'}
                • One-time payment
              </Text>
            </View>

            <View style={styles.pricingCard}>
              <Text style={styles.planName}>Monthly</Text>
              <Text style={styles.planPrice}>$3/mo</Text>
              <Text style={styles.planDescription}>
                • Unlimited everything{'\n'}
                • No ads{'\n'}
                • All premium features
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: height * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
  },
  content: {
    padding: 20,
  },
  ctaSection: {
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#667eea',
  },
  secondaryButtonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  featuresSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  featureIconText: {
    fontSize: 20,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  pricingSection: {
    marginBottom: 40,
  },
  pricingCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  pricingCard: {
    width: '30%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  popularCard: {
    backgroundColor: '#667eea',
    transform: [{ scale: 1.05 }],
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#ff6b6b',
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 10,
  },
  planDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
})
