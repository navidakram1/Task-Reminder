import { BlurView } from 'expo-blur'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import React, { useState } from 'react'
import {
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'

const { width } = Dimensions.get('window')

interface BugReport {
  title: string
  description: string
  steps_to_reproduce: string
  expected_behavior: string
  actual_behavior: string
  device_info: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: string
  screenshots: string[]
}

export default function BugReportScreen() {
  const [bugReport, setBugReport] = useState<BugReport>({
    title: '',
    description: '',
    steps_to_reproduce: '',
    expected_behavior: '',
    actual_behavior: '',
    device_info: `${Platform.OS} ${Platform.Version}`,
    severity: 'medium',
    category: 'general',
    screenshots: []
  })
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const severityOptions = [
    { value: 'low', label: 'Low', color: '#28a745', description: 'Minor issue, workaround available' },
    { value: 'medium', label: 'Medium', color: '#ffc107', description: 'Affects functionality but not critical' },
    { value: 'high', label: 'High', color: '#fd7e14', description: 'Major functionality broken' },
    { value: 'critical', label: 'Critical', color: '#dc3545', description: 'App crashes or data loss' }
  ]

  const categoryOptions = [
    { value: 'general', label: 'General', icon: '🐛' },
    { value: 'tasks', label: 'Tasks', icon: '✅' },
    { value: 'bills', label: 'Bills', icon: '💰' },
    { value: 'notifications', label: 'Notifications', icon: '🔔' },
    { value: 'sync', label: 'Sync Issues', icon: '🔄' },
    { value: 'performance', label: 'Performance', icon: '⚡' },
    { value: 'ui', label: 'User Interface', icon: '🎨' },
    { value: 'auth', label: 'Authentication', icon: '🔐' }
  ]

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to attach screenshots.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri
        setBugReport(prev => ({
          ...prev,
          screenshots: [...prev.screenshots, imageUri]
        }))
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  const removeScreenshot = (index: number) => {
    setBugReport(prev => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index)
    }))
  }

  const submitBugReport = async () => {
    if (!bugReport.title.trim() || !bugReport.description.trim()) {
      Alert.alert('Missing Information', 'Please provide a title and description for the bug report.')
      return
    }

    setLoading(true)

    try {
      // Upload screenshots if any
      const uploadedScreenshots = []
      for (const screenshot of bugReport.screenshots) {
        try {
          const fileName = `bug-reports/${user?.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
          const { data, error } = await supabase.storage
            .from('bug-reports')
            .upload(fileName, {
              uri: screenshot,
              type: 'image/jpeg',
              name: fileName,
            } as any)

          if (error) throw error
          uploadedScreenshots.push(data.path)
        } catch (uploadError) {
          console.error('Error uploading screenshot:', uploadError)
        }
      }

      // Submit bug report
      const { error } = await supabase
        .from('bug_reports')
        .insert({
          user_id: user?.id,
          title: bugReport.title.trim(),
          description: bugReport.description.trim(),
          steps_to_reproduce: bugReport.steps_to_reproduce.trim(),
          expected_behavior: bugReport.expected_behavior.trim(),
          actual_behavior: bugReport.actual_behavior.trim(),
          device_info: bugReport.device_info,
          severity: bugReport.severity,
          category: bugReport.category,
          screenshots: uploadedScreenshots,
          status: 'open',
          user_email: user?.email
        })

      if (error) throw error

      // Track analytics
      await supabase
        .from('analytics_events')
        .insert({
          user_id: user?.id,
          event_type: 'bug_report_submitted',
          event_data: {
            severity: bugReport.severity,
            category: bugReport.category,
            has_screenshots: uploadedScreenshots.length > 0
          }
        })

      Alert.alert(
        'Bug Report Submitted',
        'Thank you for reporting this bug! Our team will review it and get back to you soon.',
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      )
    } catch (error: any) {
      console.error('Error submitting bug report:', error)
      Alert.alert('Error', 'Failed to submit bug report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.backgroundGradient}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Report Bug</Text>
              <View style={styles.placeholder} />
            </View>

            {/* Form */}
            <BlurView intensity={20} style={styles.formCard}>
              <View style={styles.formContent}>
                <Text style={styles.formTitle}>Help us fix the issue</Text>
                <Text style={styles.formSubtitle}>
                  The more details you provide, the faster we can resolve the problem.
                </Text>

                {/* Bug Title */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Bug Title *</Text>
                  <TextInput
                    style={styles.input}
                    value={bugReport.title}
                    onChangeText={(text) => setBugReport(prev => ({ ...prev, title: text }))}
                    placeholder="Brief description of the bug"
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    maxLength={100}
                  />
                </View>

                {/* Category */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.categoryContainer}>
                      {categoryOptions.map((category) => (
                        <TouchableOpacity
                          key={category.value}
                          style={[
                            styles.categoryButton,
                            bugReport.category === category.value && styles.categoryButtonActive
                          ]}
                          onPress={() => setBugReport(prev => ({ ...prev, category: category.value }))}
                        >
                          <Text style={styles.categoryIcon}>{category.icon}</Text>
                          <Text style={[
                            styles.categoryText,
                            bugReport.category === category.value && styles.categoryTextActive
                          ]}>
                            {category.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Severity */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Severity</Text>
                  <View style={styles.severityContainer}>
                    {severityOptions.map((severity) => (
                      <TouchableOpacity
                        key={severity.value}
                        style={[
                          styles.severityButton,
                          bugReport.severity === severity.value && styles.severityButtonActive,
                          { borderColor: severity.color }
                        ]}
                        onPress={() => setBugReport(prev => ({ ...prev, severity: severity.value as any }))}
                      >
                        <Text style={[
                          styles.severityLabel,
                          bugReport.severity === severity.value && { color: severity.color }
                        ]}>
                          {severity.label}
                        </Text>
                        <Text style={styles.severityDescription}>{severity.description}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Description */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={bugReport.description}
                    onChangeText={(text) => setBugReport(prev => ({ ...prev, description: text }))}
                    placeholder="Describe what happened and what you were trying to do"
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                  />
                </View>

                {/* Steps to Reproduce */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Steps to Reproduce</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={bugReport.steps_to_reproduce}
                    onChangeText={(text) => setBugReport(prev => ({ ...prev, steps_to_reproduce: text }))}
                    placeholder="1. Go to...\n2. Click on...\n3. See error"
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    multiline
                    numberOfLines={3}
                    maxLength={300}
                  />
                </View>

                {/* Expected vs Actual Behavior */}
                <View style={styles.behaviorContainer}>
                  <View style={styles.behaviorColumn}>
                    <Text style={styles.label}>Expected Behavior</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={bugReport.expected_behavior}
                      onChangeText={(text) => setBugReport(prev => ({ ...prev, expected_behavior: text }))}
                      placeholder="What should happen?"
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                      multiline
                      numberOfLines={3}
                      maxLength={200}
                    />
                  </View>
                  <View style={styles.behaviorColumn}>
                    <Text style={styles.label}>Actual Behavior</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={bugReport.actual_behavior}
                      onChangeText={(text) => setBugReport(prev => ({ ...prev, actual_behavior: text }))}
                      placeholder="What actually happened?"
                      placeholderTextColor="rgba(255, 255, 255, 0.6)"
                      multiline
                      numberOfLines={3}
                      maxLength={200}
                    />
                  </View>
                </View>

                {/* Device Info */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Device Information</Text>
                  <TextInput
                    style={styles.input}
                    value={bugReport.device_info}
                    onChangeText={(text) => setBugReport(prev => ({ ...prev, device_info: text }))}
                    placeholder="Device model, OS version, app version"
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  />
                </View>

                {/* Screenshots */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Screenshots (Optional)</Text>
                  <Text style={styles.helperText}>
                    Screenshots help us understand the issue better
                  </Text>
                  
                  <TouchableOpacity style={styles.addScreenshotButton} onPress={pickImage}>
                    <Text style={styles.addScreenshotIcon}>📷</Text>
                    <Text style={styles.addScreenshotText}>Add Screenshot</Text>
                  </TouchableOpacity>

                  {bugReport.screenshots.length > 0 && (
                    <View style={styles.screenshotsContainer}>
                      {bugReport.screenshots.map((screenshot, index) => (
                        <View key={index} style={styles.screenshotItem}>
                          <Image source={{ uri: screenshot }} style={styles.screenshotImage} />
                          <TouchableOpacity
                            style={styles.removeScreenshotButton}
                            onPress={() => removeScreenshot(index)}
                          >
                            <Text style={styles.removeScreenshotText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={submitBugReport}
                  disabled={loading}
                >
                  <Text style={styles.submitButtonText}>
                    {loading ? 'Submitting...' : 'Submit Bug Report'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.privacyNote}>
                  By submitting this report, you agree to share the provided information with our support team to help resolve the issue.
                </Text>
              </View>
            </BlurView>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  formCard: {
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  formContent: {
    padding: 20,
  },
  formTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  formSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  categoryButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoryIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  categoryText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  severityContainer: {
    gap: 8,
  },
  severityButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  severityButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  severityLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  severityDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  behaviorContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  behaviorColumn: {
    flex: 1,
  },
  addScreenshotButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
  },
  addScreenshotIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  addScreenshotText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  screenshotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  screenshotItem: {
    position: 'relative',
  },
  screenshotImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeScreenshotButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#dc3545',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeScreenshotText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  submitButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
  },
  privacyNote: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
  helperText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginBottom: 12,
  },
})
