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
import { supabase } from '../../lib/supabase'

export default function CreateJoinHouseholdScreen() {
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [householdName, setHouseholdName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'member' | 'captain'>('member')
  const { user } = useAuth()

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const handleCreateHousehold = async () => {
    if (!householdName.trim()) {
      Alert.alert('Error', 'Please enter a household name')
      return
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a household')
      return
    }

    setLoading(true)
    try {
      console.log('Creating household for user:', user.id)

      // Ensure user profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      console.log('User profile check:', { profileData, profileError })

      // Create profile if it doesn't exist
      if (profileError && profileError.code === 'PGRST116') {
        console.log('Creating user profile...')
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            name: user.email?.split('@')[0] || 'User',
          })

        if (createProfileError) {
          console.error('Profile creation error:', createProfileError)
          throw new Error('Failed to create user profile')
        }
      }

      const code = generateInviteCode()
      console.log('Generated invite code:', code)

      // Create household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert({
          name: householdName.trim(),
          admin_id: user.id,
          invite_code: code,
        })
        .select()
        .single()

      console.log('Household creation result:', { household, householdError })

      if (householdError) {
        console.error('Household creation error:', householdError)
        throw householdError
      }

      // Add user as household member
      const { error: memberError } = await supabase
        .from('household_members')
        .insert({
          household_id: household.id,
          user_id: user.id,
          role: 'admin',
        })

      console.log('Member creation result:', { memberError })

      if (memberError) {
        console.error('Member creation error:', memberError)
        throw memberError
      }

      Alert.alert(
        'Success!',
        `Household "${householdName}" created successfully!\nInvite Code: ${code}`,
        [
          {
            text: 'Continue',
            onPress: () => router.push('/(onboarding)/invite-members'),
          },
        ]
      )
    } catch (error: any) {
      console.error('Full error object:', error)
      const errorMessage = error.message || error.details || error.hint || 'Failed to create household'
      Alert.alert('Error', `Failed to create household: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinHousehold = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code')
      return
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to join a household')
      return
    }

    setLoading(true)
    try {
      // Find household by invite code
      const { data: household, error: householdError } = await supabase
        .from('households')
        .select('*')
        .eq('invite_code', inviteCode.trim().toUpperCase())
        .single()

      if (householdError || !household) {
        Alert.alert('Error', 'Invalid invite code')
        return
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('household_members')
        .select('*')
        .eq('household_id', household.id)
        .eq('user_id', user.id)
        .single()

      if (existingMember) {
        Alert.alert('Info', 'You are already a member of this household')
        router.push('/(app)/dashboard')
        return
      }

      // Add user as household member
      const { error: memberError } = await supabase
        .from('household_members')
        .insert({
          household_id: household.id,
          user_id: user.id,
          role: selectedRole,
        })

      if (memberError) {
        throw memberError
      }

      Alert.alert(
        'Success!',
        `You've joined "${household.name}" successfully!`,
        [
          {
            text: 'Continue',
            onPress: () => router.push('/(onboarding)/profile-setup'),
          },
        ]
      )
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join household')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Set Up Your Household</Text>
          <Text style={styles.subtitle}>
            Create a new household or join an existing one
          </Text>
        </View>

        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'create' && styles.activeModeButton]}
            onPress={() => setMode('create')}
          >
            <Text style={[styles.modeButtonText, mode === 'create' && styles.activeModeButtonText]}>
              Create New
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modeButton, mode === 'join' && styles.activeModeButton]}
            onPress={() => setMode('join')}
          >
            <Text style={[styles.modeButtonText, mode === 'join' && styles.activeModeButtonText]}>
              Join Existing
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {mode === 'create' ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Household Name</Text>
                <TextInput
                  style={styles.input}
                  value={householdName}
                  onChangeText={setHouseholdName}
                  placeholder="e.g., Smith Family, Apartment 4B"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>💡 What happens next?</Text>
                <Text style={styles.infoText}>
                  • You'll become the household admin{'\n'}
                  • We'll generate a unique invite code{'\n'}
                  • You can invite others to join{'\n'}
                  • Start creating tasks and splitting bills
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.actionButton, loading && styles.disabledButton]}
                onPress={handleCreateHousehold}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>
                  {loading ? 'Creating...' : 'Create Household'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Invite Code</Text>
                <TextInput
                  style={styles.input}
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  placeholder="Enter 6-character code"
                  autoCapitalize="characters"
                  maxLength={6}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Join as</Text>
                <View style={styles.roleSelector}>
                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      selectedRole === 'member' && styles.selectedRole,
                    ]}
                    onPress={() => setSelectedRole('member')}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        selectedRole === 'member' && styles.selectedRoleText,
                      ]}
                    >
                      👤 Member
                    </Text>
                    <Text style={styles.roleDescription}>
                      Basic access to tasks and bills
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      selectedRole === 'captain' && styles.selectedRole,
                    ]}
                    onPress={() => setSelectedRole('captain')}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        selectedRole === 'captain' && styles.selectedRoleText,
                      ]}
                    >
                      ⭐ Captain
                    </Text>
                    <Text style={styles.roleDescription}>
                      Can help manage tasks and approve completions
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>🔗 Need an invite code?</Text>
                <Text style={styles.infoText}>
                  Ask a household member to share their invite code with you. You can find it in the household settings.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.actionButton, loading && styles.disabledButton]}
                onPress={handleJoinHousehold}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>
                  {loading ? 'Joining...' : 'Join Household'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.push('/(app)/dashboard')}
        >
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </TouchableOpacity>
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
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 4,
    marginBottom: 30,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeModeButton: {
    backgroundColor: '#667eea',
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeModeButtonText: {
    color: '#fff',
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
    backgroundColor: '#f8f9fa',
  },
  infoBox: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '500',
  },
  roleSelector: {
    gap: 12,
  },
  roleOption: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  selectedRole: {
    borderColor: '#667eea',
    backgroundColor: '#f0f8ff',
  },
  roleOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedRoleText: {
    color: '#667eea',
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
})
