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
    // Always go to login/auth screen after permissions
    router.push('/(auth)/landing')
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
        colors={['#FFFFFF', '#F8FAFB']}
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
        {/* Header - CLEAN */}
        <View style={styles.header}>
          <Text style={styles.title}>Permissions</Text>
          <Text style={styles.subtitle}>
            Allow permissions for the best experience
          </Text>
        </View>

        {/* Permission Cards - CLEAN */}
        <View style={styles.permissionsContainer}>
          {permissionItems.map((item, index) => (
            <Animated.View
              key={item.key}
              style={[
                styles.permissionCard,
                {
                  opacity: permissionAnimations[item.key],
                }
              ]}
            >
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
            </Animated.View>
          ))}
        </View>

        {/* Info Section - CLEAN */}
        <View style={styles.infoCard}>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>🔒 Your Privacy Matters</Text>
            <Text style={styles.infoText}>
              We only use these permissions to enhance your experience. Your data stays secure.
            </Text>
          </View>
        </View>

        {/* Navigation Buttons - CLEAN */}
        <View style={styles.navigationButtons}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue →</Text>
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
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A2332',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#5B7C99',
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 22,
  },
  permissionsContainer: {
    flex: 1,
    gap: 12,
    marginBottom: 20,
  },
  permissionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  permissionHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
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
    flexWrap: 'wrap',
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2332',
    flex: 1,
    marginRight: 8,
  },
  requiredBadge: {
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8ECEF',
  },
  requiredText: {
    fontSize: 10,
    color: '#5B7C99',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  permissionDescription: {
    fontSize: 13,
    color: '#5B7C99',
    lineHeight: 20,
    fontWeight: '400',
  },
  permissionButton: {
    backgroundColor: '#F0F4F8',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E8ECEF',
  },
  permissionButtonGranted: {
    backgroundColor: '#51cf66',
    borderColor: '#51cf66',
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B7C99',
  },
  permissionButtonTextGranted: {
    color: '#FFFFFF',
  },
  infoCard: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#F0F4F8',
    borderWidth: 1,
    borderColor: '#E8ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  infoContent: {
    padding: 14,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A2332',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 13,
    color: '#5B7C99',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F0F4F8',
    borderWidth: 1,
    borderColor: '#E8ECEF',
  },
  backButtonText: {
    fontSize: 14,
    color: '#5B7C99',
    fontWeight: '600',
  },
  continueButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#5B7C99',
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 13,
    color: '#5B7C99',
    fontWeight: '500',
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4DFE8',
  },
  activeDot: {
    backgroundColor: '#5B7C99',
    width: 20,
  },
})
