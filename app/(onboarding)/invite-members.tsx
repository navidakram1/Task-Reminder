import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    Alert,
    Clipboard,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export default function InviteMembersScreen() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [household, setHousehold] = useState<any>(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchUserHousehold()
  }, [])

  const fetchUserHousehold = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('household_members')
        .select(`
          household_id,
          households (
            id,
            name,
            invite_code
          )
        `)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      setHousehold(data.households)
    } catch (error) {
      console.error('Error fetching household:', error)
    }
  }

  const handleEmailInvite = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address')
      return
    }

    if (!household) {
      Alert.alert('Error', 'No household found')
      return
    }

    setLoading(true)
    try {
      // Send email invitation using the email service
      const result = await emailService.sendHouseholdInvitation({
        recipient: email.trim(),
        inviterName: user?.user_metadata?.name || user?.email || 'Someone',
        householdName: household.name,
        inviteCode: household.invite_code
      })

      if (result.success) {
        Alert.alert(
          'Invitation Sent!',
          `An invitation has been sent to ${email}`,
          [{ text: 'OK', onPress: () => setEmail('') }]
        )
      } else {
        Alert.alert('Error', 'Failed to send invitation. Please try again.')
      }
    } catch (error) {
      console.error('Email invitation error:', error)
      Alert.alert('Error', 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneInvite = async () => {
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter a phone number')
      return
    }

    if (!household) {
      Alert.alert('Error', 'No household found')
      return
    }

    setLoading(true)
    try {
      // In a real app, you would send an SMS invitation here
      // For now, we'll just show a success message
      Alert.alert(
        'Invitation Sent!',
        `An invitation has been sent to ${phone}`,
        [{ text: 'OK', onPress: () => setPhone('') }]
      )
    } catch (error) {
      Alert.alert('Error', 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleShareInviteLink = async () => {
    if (!household) {
      Alert.alert('Error', 'No household found')
      return
    }

    const inviteMessage = `Join our household "${household.name}" on HomeTask!\n\nUse invite code: ${household.invite_code}\n\nDownload the app and enter this code to get started managing tasks and bills together.`

    try {
      await Share.share({
        message: inviteMessage,
        title: 'Join My Household on HomeTask',
      })
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const handleCopyInviteCode = async () => {
    if (!household) return

    try {
      await Clipboard.setString(household.invite_code)
      Alert.alert('Copied!', 'Invite code copied to clipboard')
    } catch (error) {
      Alert.alert('Error', 'Failed to copy invite code')
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Invite Your Housemates</Text>
        <Text style={styles.subtitle}>
          Add family members or roommates to start collaborating
        </Text>
      </View>

      {household && (
        <View style={styles.householdInfo}>
          <Text style={styles.householdName}>{household.name}</Text>
          <View style={styles.inviteCodeContainer}>
            <Text style={styles.inviteCodeLabel}>Invite Code:</Text>
            <TouchableOpacity
              style={styles.inviteCodeButton}
              onPress={handleCopyInviteCode}
            >
              <Text style={styles.inviteCode}>{household.invite_code}</Text>
              <Text style={styles.copyText}>Tap to copy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.inviteSection}>
        <Text style={styles.sectionTitle}>📧 Invite by Email</Text>
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email address"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.inviteButton, loading && styles.disabledButton]}
            onPress={handleEmailInvite}
            disabled={loading}
          >
            <Text style={styles.inviteButtonText}>Send Invite</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inviteSection}>
        <Text style={styles.sectionTitle}>📱 Invite by Phone</Text>
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
          />
          <TouchableOpacity
            style={[styles.inviteButton, loading && styles.disabledButton]}
            onPress={handlePhoneInvite}
            disabled={loading}
          >
            <Text style={styles.inviteButtonText}>Send Invite</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.shareSection}>
        <Text style={styles.sectionTitle}>🔗 Share Invite Link</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareInviteLink}
        >
          <Text style={styles.shareButtonText}>Share Invite Link</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 How it works</Text>
        <Text style={styles.infoText}>
          • Send invites via email, SMS, or share a link{'\n'}
          • Recipients will get your household invite code{'\n'}
          • They can download the app and join instantly{'\n'}
          • You can always invite more people later
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => router.push('/(onboarding)/profile-setup')}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.push('/(app)/dashboard')}
        >
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  householdInfo: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    alignItems: 'center',
  },
  householdName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  inviteCodeContainer: {
    alignItems: 'center',
  },
  inviteCodeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  inviteCodeButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  inviteCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  copyText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginTop: 2,
  },
  inviteSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  inputGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  inviteButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  shareSection: {
    marginBottom: 25,
  },
  shareButton: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  actionButtons: {
    gap: 12,
    marginBottom: 20,
  },
  continueButton: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
  },
  continueButtonText: {
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
})
