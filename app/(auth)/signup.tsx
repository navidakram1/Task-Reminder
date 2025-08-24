import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useRef, useState } from 'react'
import {
    Alert,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import { useAuth } from '../../contexts/AuthContext'

const { width, height } = Dimensions.get('window')

export default function SignUpScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [emailVerificationSent, setEmailVerificationSent] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  const { signUp, signInWithGoogle, signInWithApple } = useAuth()

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
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start()
  }, [])

  // Password strength calculation
  useEffect(() => {
    const calculateStrength = (pwd: string) => {
      let strength = 0
      if (pwd.length >= 6) strength += 1
      if (pwd.length >= 8) strength += 1
      if (/[A-Z]/.test(pwd)) strength += 1
      if (/[0-9]/.test(pwd)) strength += 1
      if (/[^A-Za-z0-9]/.test(pwd)) strength += 1
      return strength
    }
    setPasswordStrength(calculateStrength(password))
  }, [password])

  const handleSignUp = async () => {
    // Validation
    if (!email || !password || !name) {
      Alert.alert('Missing Information', 'Please fill in all fields to continue')
      return
    }

    if (!termsAccepted) {
      Alert.alert('Terms Required', 'Please accept the Terms of Service and Privacy Policy to continue')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please check and try again.')
      return
    }

    if (passwordStrength < 2) {
      Alert.alert('Weak Password', 'Please create a stronger password with at least 6 characters')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await signUp(email, password, name)

      if (error) {
        console.error('Sign up error:', error)
        Alert.alert('Sign Up Error', error.message || 'Failed to create account')
      } else if (data?.user) {
        console.log('Sign up successful:', data.user.id)
        setEmailVerificationSent(true)

        // Show success message with email verification info
        Alert.alert(
          '🎉 Welcome to SplitDuty!',
          `We've sent a verification email to ${email}. Please check your inbox and click the verification link to activate your account.`,
          [
            {
              text: 'Resend Email',
              style: 'default',
              onPress: () => {
                // TODO: Implement resend verification email
                Alert.alert('Email Sent', 'Verification email has been resent!')
              }
            },
            {
              text: 'Continue to Login',
              style: 'default',
              onPress: () => router.push('/(auth)/login')
            }
          ]
        )
      } else {
        Alert.alert('Error', 'Account creation failed. Please try again.')
      }
    } catch (error) {
      console.error('Unexpected sign up error:', error)
      Alert.alert('Error', 'An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialSignUp = async (provider: 'Google' | 'Apple') => {
    setSocialLoading(provider)
    try {
      let result
      if (provider === 'Google') {
        result = await signInWithGoogle()
      } else {
        result = await signInWithApple()
      }

      const { data, error } = result

      if (error) {
        Alert.alert('Social Sign Up Error', error.message)
      } else if (data?.url) {
        // For mobile, we need to handle the OAuth redirect
        // This will open the browser for authentication
        Alert.alert(
          'Authentication Required',
          'You will be redirected to complete the sign-up process.',
          [{ text: 'Continue', onPress: () => {} }]
        )
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred during social sign up')
    } finally {
      setSocialLoading(null)
    }
  }

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
      case 1: return '#ef4444'
      case 2: return '#f59e0b'
      case 3: return '#eab308'
      case 4: return '#22c55e'
      case 5: return '#16a34a'
      default: return '#e5e7eb'
    }
  }

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0:
      case 1: return 'Weak'
      case 2: return 'Fair'
      case 3: return 'Good'
      case 4: return 'Strong'
      case 5: return 'Very Strong'
      default: return ''
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="transparent" translucent />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.backgroundGradient}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <Animated.View style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#ffffff', '#f8f9fa']}
                style={styles.logoCircle}
              >
                <Text style={styles.logoEmoji}>🏠</Text>
              </LinearGradient>
            </View>
            <Text style={styles.title}>Join SplitDuty</Text>
            <Text style={styles.subtitle}>Turn your household into a dream team</Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View style={[
            styles.formCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}>
            <BlurView intensity={20} style={styles.formBlur}>
              <View style={styles.form}>
                {/* Name Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={[
                    styles.inputContainer,
                    focusedField === 'name' && styles.inputContainerFocused
                  ]}>
                    <Text style={styles.inputIcon}>👤</Text>
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="Enter your full name"
                      placeholderTextColor="#9ca3af"
                      autoCapitalize="words"
                      autoComplete="name"
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>

                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={[
                    styles.inputContainer,
                    focusedField === 'email' && styles.inputContainerFocused
                  ]}>
                    <Text style={styles.inputIcon}>📧</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter your email"
                      placeholderTextColor="#9ca3af"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={[
                    styles.inputContainer,
                    focusedField === 'password' && styles.inputContainerFocused
                  ]}>
                    <Text style={styles.inputIcon}>🔒</Text>
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Create a strong password"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Password Strength Indicator */}
                  {password.length > 0 && (
                    <View style={styles.passwordStrength}>
                      <View style={styles.strengthBar}>
                        <View
                          style={[
                            styles.strengthFill,
                            {
                              width: `${(passwordStrength / 5) * 100}%`,
                              backgroundColor: getPasswordStrengthColor()
                            }
                          ]}
                        />
                      </View>
                      <Text style={[styles.strengthText, { color: getPasswordStrengthColor() }]}>
                        {getPasswordStrengthText()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={[
                    styles.inputContainer,
                    focusedField === 'confirmPassword' && styles.inputContainerFocused,
                    confirmPassword && password !== confirmPassword && styles.inputContainerError
                  ]}>
                    <Text style={styles.inputIcon}>🔐</Text>
                    <TextInput
                      style={styles.input}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm your password"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!showConfirmPassword}
                      autoComplete="new-password"
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                    </TouchableOpacity>
                  </View>
                  {confirmPassword && password !== confirmPassword && (
                    <Text style={styles.errorText}>Passwords do not match</Text>
                  )}
                </View>

                {/* Terms and Conditions */}
                <View style={styles.termsContainer}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setTermsAccepted(!termsAccepted)}
                  >
                    <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                      {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={styles.termsTextContainer}>
                      <Text style={styles.termsText}>
                        I agree to the{' '}
                        <Text style={styles.termsLink}>Terms of Service</Text>
                        {' '}and{' '}
                        <Text style={styles.termsLink}>Privacy Policy</Text>
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Sign Up Button */}
                <TouchableOpacity
                  style={[
                    styles.signUpButton,
                    loading && styles.disabledButton,
                    !termsAccepted && styles.disabledButton
                  ]}
                  onPress={handleSignUp}
                  disabled={loading || !termsAccepted}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={loading || !termsAccepted ? ['#9ca3af', '#6b7280'] : ['#667eea', '#764ba2']}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.signUpButtonText}>
                      {loading ? '🔄 Creating Account...' : '🚀 Create Account'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Social Login Buttons */}
                <View style={styles.socialButtons}>
                  <TouchableOpacity
                    style={[styles.socialButton, socialLoading === 'Google' && styles.disabledButton]}
                    onPress={() => handleSocialSignUp('Google')}
                    disabled={socialLoading !== null}
                    activeOpacity={0.8}
                  >
                    <View style={styles.socialButtonContent}>
                      <Text style={styles.socialIcon}>
                        {socialLoading === 'Google' ? '🔄' : '🔍'}
                      </Text>
                      <Text style={styles.socialButtonText}>
                        {socialLoading === 'Google' ? 'Connecting...' : 'Continue with Google'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.socialButton, socialLoading === 'Apple' && styles.disabledButton]}
                    onPress={() => handleSocialSignUp('Apple')}
                    disabled={socialLoading !== null}
                    activeOpacity={0.8}
                  >
                    <View style={styles.socialButtonContent}>
                      <Text style={styles.socialIcon}>
                        {socialLoading === 'Apple' ? '🔄' : '🍎'}
                      </Text>
                      <Text style={styles.socialButtonText}>
                        {socialLoading === 'Apple' ? 'Connecting...' : 'Continue with Apple'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Email Verification Notice */}
                {emailVerificationSent && (
                  <View style={styles.verificationNotice}>
                    <Text style={styles.verificationIcon}>📧</Text>
                    <Text style={styles.verificationText}>
                      Verification email sent! Please check your inbox.
                    </Text>
                  </View>
                )}
              </View>
            </BlurView>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 80 : 60,
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  logoEmoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  formCard: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    marginBottom: 32,
  },
  formBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  form: {
    padding: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  inputContainerFocused: {
    borderColor: '#667eea',
    elevation: 4,
    shadowOpacity: 0.1,
  },
  inputContainerError: {
    borderColor: '#ef4444',
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
    color: '#6b7280',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 16,
  },
  eyeButton: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 18,
    color: '#6b7280',
  },
  passwordStrength: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    marginRight: 12,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  signUpButton: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 30,
  },
  disabledButton: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#666',
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  socialButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  socialButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#666',
  },
  linkText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  termsText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  // Modern component styles
  termsContainer: {
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  termsTextContainer: {
    flex: 1,
  },
  termsLink: {
    color: '#667eea',
    fontWeight: '600',
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderRadius: 16,
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  socialIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  verificationNotice: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  verificationIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  verificationText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
  },
})
