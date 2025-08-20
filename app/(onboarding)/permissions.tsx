import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'

const { width, height } = Dimensions.get('window')

export default function PermissionsScreen() {
  const [permissions, setPermissions] = useState({
    notifications: false,
    camera: false,
    contacts: false,
  })
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const permissionAnimations = useRef({
    notifications: new Animated.Value(0),
    camera: new Animated.Value(0),
    contacts: new Animated.Value(0),
  }).current

  const permissionItems = [
    {
      key: 'notifications',
      icon: '🔔',
      title: 'Push Notifications',
      description: 'Get reminders for tasks and bills so you never miss a deadline',
      benefit: 'Stay on top of your responsibilities',
      required: true,
    },
    {
      key: 'camera',
      icon: '📷',
      title: 'Camera Access',
      description: 'Take photos to prove task completion and upload bill receipts',
      benefit: 'Build trust and keep records',
      required: false,
    },
    {
      key: 'contacts',
      icon: '👥',
      title: 'Contacts Access',
      description: 'Easily invite family members and roommates to your household',
      benefit: 'Quick setup and invitations',
      required: false,
    },
  ]

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()

    // Staggered permission card animations
    permissionItems.forEach((_, index) => {
      setTimeout(() => {
        Animated.timing(permissionAnimations[permissionItems[index].key], {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start()
      }, index * 200)
    })
  }, [])

  const requestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync()
      const granted = status === 'granted'
      
      setPermissions(prev => ({ ...prev, notifications: granted }))
      
      if (!granted) {
        Alert.alert(
          'Notifications Disabled',
          'You can enable notifications later in your device settings.',
          [{ text: 'OK' }]
        )
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
    }
  }

  const requestCameraPermission = async () => {
    // For now, we'll simulate camera permission
    // In a real app, you'd use expo-camera or expo-image-picker
    setPermissions(prev => ({ ...prev, camera: true }))
  }

  const requestContactsPermission = async () => {
    // For now, we'll simulate contacts permission
    // In a real app, you'd use expo-contacts
    setPermissions(prev => ({ ...prev, contacts: true }))
  }

  const handlePermissionRequest = (key: string) => {
    switch (key) {
      case 'notifications':
        requestNotificationPermission()
        break
      case 'camera':
        requestCameraPermission()
        break
      case 'contacts':
        requestContactsPermission()
        break
    }
  }

  const handleContinue = () => {
    if (!permissions.notifications) {
      Alert.alert(
        'Notifications Recommended',
        'Notifications help you stay on top of tasks and bills. Are you sure you want to continue without them?',
        [
          { text: 'Enable Notifications', onPress: requestNotificationPermission },
          { text: 'Continue Anyway', onPress: () => router.push('/(onboarding)/welcome') }
        ]
      )
    } else {
      router.push('/(onboarding)/welcome')
    }
  }

  const handleBack = () => {
    router.back()
  }

  const handleSkip = () => {
    router.replace('/(auth)/landing')
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

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
          <Text style={styles.title}>Enable Permissions</Text>
          <Text style={styles.subtitle}>
            Help us provide the best experience by allowing these permissions
          </Text>
        </View>

        {/* Permission Cards */}
        <View style={styles.permissionsContainer}>
          {permissionItems.map((item, index) => (
            <Animated.View
              key={item.key}
              style={[
                styles.permissionCard,
                {
                  opacity: permissionAnimations[item.key],
                  transform: [
                    {
                      translateY: permissionAnimations[item.key].interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      })
                    }
                  ]
                }
              ]}
            >
              <BlurView intensity={20} style={styles.cardBlur}>
                <View style={styles.cardContent}>
                  <View style={styles.permissionHeader}>
                    <View style={styles.iconContainer}>
                      <Text style={styles.permissionIcon}>{item.icon}</Text>
                    </View>
                    <View style={styles.permissionInfo}>
                      <View style={styles.titleRow}>
                        <Text style={styles.permissionTitle}>{item.title}</Text>
                        {item.required && (
                          <View style={styles.requiredBadge}>
                            <Text style={styles.requiredText}>Required</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.permissionDescription}>{item.description}</Text>
                      <Text style={styles.permissionBenefit}>✨ {item.benefit}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.permissionButton,
                      permissions[item.key] && styles.permissionButtonGranted
                    ]}
                    onPress={() => handlePermissionRequest(item.key)}
                    disabled={permissions[item.key]}
                  >
                    <Text style={[
                      styles.permissionButtonText,
                      permissions[item.key] && styles.permissionButtonTextGranted
                    ]}>
                      {permissions[item.key] ? '✓ Granted' : 'Allow'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </Animated.View>
          ))}
        </View>

        {/* Info Section */}
        <BlurView intensity={15} style={styles.infoCard}>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>🔒 Your Privacy Matters</Text>
            <Text style={styles.infoText}>
              We only use these permissions to enhance your HomeTask experience. 
              Your data stays secure and is never shared with third parties.
            </Text>
          </View>
        </BlurView>

        {/* Navigation Buttons */}
        <View style={styles.navigationButtons}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>Continue →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </TouchableOpacity>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressDots}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
          </View>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
  },
  permissionsContainer: {
    flex: 1,
    gap: 16,
    marginBottom: 20,
  },
  permissionCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardContent: {
    padding: 20,
  },
  permissionHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  permissionIcon: {
    fontSize: 24,
  },
  permissionInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  requiredText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  permissionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: 4,
  },
  permissionBenefit: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  permissionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  permissionButtonGranted: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  permissionButtonTextGranted: {
    color: '#ffffff',
  },
  infoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  infoContent: {
    padding: 16,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 16,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  continueButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#667eea',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeDot: {
    backgroundColor: '#ffffff',
    width: 24,
  },
})
