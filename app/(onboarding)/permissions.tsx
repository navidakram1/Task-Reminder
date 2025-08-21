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
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 10,
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
    gap: 20,
    marginBottom: 30,
    paddingHorizontal: 5,
  },
  permissionCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cardBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardContent: {
    padding: 24,
  },
  permissionHeader: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  permissionIcon: {
    fontSize: 28,
  },
  permissionInfo: {
    flex: 1,
    paddingTop: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    flex: 1,
    marginRight: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  requiredBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  requiredText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  permissionDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
    marginBottom: 8,
    fontWeight: '400',
  },
  permissionBenefit: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  permissionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  permissionButtonGranted: {
    backgroundColor: 'rgba(76, 175, 80, 0.95)',
    borderColor: 'rgba(76, 175, 80, 0.5)',
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#667eea',
    letterSpacing: 0.5,
  },
  permissionButtonTextGranted: {
    color: '#ffffff',
  },
  infoCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  infoContent: {
    padding: 20,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  infoText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 16,
    paddingHorizontal: 5,
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
