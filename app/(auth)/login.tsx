import { router } from 'expo-router'
import { useState } from 'react'
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { useAuth } from '../../contexts/AuthContext'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const { signIn, signInWithGoogle, signInWithApple } = useAuth()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await signIn(email, password)
      
      if (error) {
        Alert.alert('Login Error', error.message)
      } else {
        // Navigation will be handled by the auth state change
        router.replace('/(app)/dashboard')
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'Google' | 'Apple') => {
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
        Alert.alert('Social Login Error', error.message)
      } else if (data?.url) {
        // For mobile, we need to handle the OAuth redirect
        // This will open the browser for authentication
        Alert.alert(
          'Authentication Required',
          'You will be redirected to complete the sign-in process.',
          [{ text: 'Continue', onPress: () => {} }]
        )
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred during social login')
    } finally {
      setSocialLoading(null)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your HomeTask account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <TouchableOpacity
              style={[styles.socialButton, socialLoading === 'Google' && styles.disabledButton]}
              onPress={() => handleSocialLogin('Google')}
              disabled={socialLoading !== null}
            >
              <Text style={styles.socialButtonText}>
                {socialLoading === 'Google' ? '🔄 Connecting...' : '🔍 Google'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, socialLoading === 'Apple' && styles.disabledButton]}
              onPress={() => handleSocialLogin('Apple')}
              disabled={socialLoading !== null}
            >
              <Text style={styles.socialButtonText}>
                {socialLoading === 'Apple' ? '🔄 Connecting...' : '🍎 Apple'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#333333',
    // Fix iOS autofill yellow background
    ...(Platform.OS === 'ios' && {
      backgroundColor: '#ffffff',
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    }),
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: '#1F51FF',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#1F51FF',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
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
  },
  footerText: {
    fontSize: 16,
    color: '#666',
  },
  linkText: {
    fontSize: 16,
    color: '#1F51FF',
    fontWeight: '600',
  },
})
