import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

const { width, height } = Dimensions.get('window')

export default function Screen7Profile() {
  const [name, setName] = useState('')
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    taskReminders: true,
    billAlerts: true,
  })

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const handleComplete = () => {
    if (name.trim()) {
      router.replace('/(tabs)')
    }
  }

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#F8F9FA', '#FFFFFF']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Set up your preferences to get started.
            </Text>
          </View>

          {/* Profile Photo Section */}
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.photoUpload}>
              <Text style={styles.photoIcon}>📷</Text>
              <Text style={styles.photoText}>Add Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Name Input */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Notification Preferences */}
          <View style={styles.preferencesSection}>
            <Text style={styles.preferencesTitle}>Notification Preferences</Text>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceContent}>
                <Text style={styles.preferenceName}>📧 Email Notifications</Text>
                <Text style={styles.preferenceDescription}>
                  Receive updates via email
                </Text>
              </View>
              <Switch
                value={notifications.email}
                onValueChange={() => toggleNotification('email')}
                trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
                thumbColor={notifications.email ? '#10B981' : '#F3F4F6'}
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceContent}>
                <Text style={styles.preferenceName}>🔔 Push Notifications</Text>
                <Text style={styles.preferenceDescription}>
                  Get instant alerts on your device
                </Text>
              </View>
              <Switch
                value={notifications.push}
                onValueChange={() => toggleNotification('push')}
                trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
                thumbColor={notifications.push ? '#10B981' : '#F3F4F6'}
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceContent}>
                <Text style={styles.preferenceName}>✅ Task Reminders</Text>
                <Text style={styles.preferenceDescription}>
                  Remind me about upcoming tasks
                </Text>
              </View>
              <Switch
                value={notifications.taskReminders}
                onValueChange={() => toggleNotification('taskReminders')}
                trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
                thumbColor={notifications.taskReminders ? '#10B981' : '#F3F4F6'}
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceContent}>
                <Text style={styles.preferenceName}>💳 Bill Alerts</Text>
                <Text style={styles.preferenceDescription}>
                  Notify me about bill payments
                </Text>
              </View>
              <Switch
                value={notifications.billAlerts}
                onValueChange={() => toggleNotification('billAlerts')}
                trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
                thumbColor={notifications.billAlerts ? '#10B981' : '#F3F4F6'}
              />
            </View>
          </View>

          {/* Complete Button */}
          <TouchableOpacity
            style={[
              styles.completeButton,
              !name.trim() && styles.completeButtonDisabled,
            ]}
            onPress={handleComplete}
            disabled={!name.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.completeButtonText}>Complete Setup</Text>
          </TouchableOpacity>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, styles.activeDot]} />
            <View style={[styles.progressDot, styles.activeDot]} />
            <View style={[styles.progressDot, styles.activeDot]} />
            <View style={[styles.progressDot, styles.activeDot]} />
            <View style={[styles.progressDot, styles.activeDot]} />
            <View style={[styles.progressDot, styles.activeDot]} />
            <View style={[styles.progressDot, styles.activeDot]} />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  content: {
    width: '100%',
  },
  titleSection: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  photoUpload: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  photoIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  photoText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  formSection: {
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  preferencesSection: {
    marginBottom: 30,
  },
  preferencesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
  },
  completeButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#10B981',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  completeButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  activeDot: {
    backgroundColor: '#10B981',
  },
})

