import { Picker } from '@react-native-picker/picker'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    Alert,
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

export default function CreateEditTaskScreen() {
  const { edit } = useLocalSearchParams()
  const isEditing = !!edit
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none')
  const [randomAssignment, setRandomAssignment] = useState(false)
  const [selectedEmoji, setSelectedEmoji] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [householdMembers, setHouseholdMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [household, setHousehold] = useState<any>(null)
  const [households, setHouseholds] = useState<any[]>([])
  const [selectedHouseholdId, setSelectedHouseholdId] = useState('')
  const { user } = useAuth()

  // Common task emojis
  const taskEmojis = [
    '📋', '✅', '🏠', '🧹', '🍽️', '🛒', '🧺', '🚿', '🛏️', '🌱',
    '🔧', '💡', '📚', '💻', '🎯', '⚡', '🔥', '⭐', '🎉', '💪',
    '🏃', '🎵', '🎨', '📝', '📞', '💰', '🎁', '🍳', '🧽', '🪴'
  ]

  useEffect(() => {
    fetchUserHouseholds()
    if (isEditing) {
      fetchTaskDetails()
    }
  }, [])

  useEffect(() => {
    if (selectedHouseholdId) {
      fetchHouseholdMembers(selectedHouseholdId)
    }
  }, [selectedHouseholdId])

  const fetchUserHouseholds = async () => {
    if (!user) return

    try {
      // Get all user's households
      const { data: householdData, error } = await supabase
        .from('household_members')
        .select(`
          household_id,
          role,
          households (
            id,
            name,
            type
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error

      const userHouseholds = householdData?.map(hm => ({
        id: hm.household_id,
        name: hm.households.name,
        type: hm.households.type || 'household',
        role: hm.role
      })) || []

      console.log('Fetched user households:', userHouseholds)
      setHouseholds(userHouseholds)

      // Set default household (first one or get from user preferences)
      if (userHouseholds.length > 0) {
        const defaultHousehold = userHouseholds[0] // You can implement logic to get user's preferred default
        console.log('Setting default household:', defaultHousehold)
        setSelectedHouseholdId(defaultHousehold.id)
        setHousehold(defaultHousehold)
      }
    } catch (error) {
      console.error('Error fetching user households:', error)
    }
  }

  const fetchHouseholdMembers = async (householdId: string) => {
    if (!householdId) return

    try {
      // Get all household members with their profile information
      const { data: members, error } = await supabase
        .from('household_members')
        .select(`
          user_id,
          role,
          users!inner (
            id,
            email,
            user_metadata
          )
        `)
        .eq('household_id', householdId)

      if (error) throw error

      // Transform the data to include name from user_metadata
      const transformedMembers = members?.map(member => ({
        user_id: member.user_id,
        role: member.role,
        profiles: {
          id: member.users.id,
          name: member.users.user_metadata?.name ||
                member.users.user_metadata?.full_name ||
                member.users.email?.split('@')[0] || 'Unknown',
          email: member.users.email
        }
      })) || []

      console.log('Fetched household members:', transformedMembers)
      setHouseholdMembers(transformedMembers)
    } catch (error) {
      console.error('Error fetching household members:', error)
      // Fallback: try alternative query structure
      try {
        const { data: fallbackMembers } = await supabase
          .from('household_members')
          .select('user_id, role')
          .eq('household_id', householdId)

        if (fallbackMembers) {
          const membersWithNames = await Promise.all(
            fallbackMembers.map(async (member) => {
              const { data: userData } = await supabase.auth.admin.getUserById(member.user_id)
              return {
                user_id: member.user_id,
                role: member.role,
                profiles: {
                  id: member.user_id,
                  name: userData.user?.user_metadata?.name ||
                        userData.user?.user_metadata?.full_name ||
                        userData.user?.email?.split('@')[0] || 'Unknown',
                  email: userData.user?.email || ''
                }
              }
            })
          )
          setHouseholdMembers(membersWithNames)
        }
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError)
        setHouseholdMembers([])
      }
    }
  }

  const fetchTaskDetails = async () => {
    if (!edit) return

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', edit)
        .single()

      if (error) throw error

      setTitle(data.title)
      setDescription(data.description || '')
      setDueDate(data.due_date || '')
      setAssigneeId(data.assignee_id || '')
      setRecurrence(data.recurrence || 'none')
      setSelectedEmoji(data.emoji || '')
    } catch (error) {
      console.error('Error fetching task details:', error)
      Alert.alert('Error', 'Failed to load task details')
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title')
      return
    }

    if (!selectedHouseholdId) {
      Alert.alert('Error', 'Please select a household')
      return
    }

    setLoading(true)
    try {
      const taskData = {
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate || null,
        assignee_id: randomAssignment ? null : (assigneeId || null),
        recurrence: recurrence === 'none' ? null : recurrence,
        emoji: selectedEmoji || null,
        household_id: selectedHouseholdId,
        created_by: user?.id,
      }

      if (isEditing) {
        // Update existing task
        const { error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', edit)

        if (error) throw error
        Alert.alert('Success', 'Task updated successfully')
      } else {
        // Create new task
        const { error } = await supabase
          .from('tasks')
          .insert(taskData)

        if (error) throw error
        Alert.alert('Success', 'Task created successfully')
      }

      router.back()
    } catch (error: any) {
      console.error('Error saving task:', error)
      Alert.alert('Error', error.message || 'Failed to save task')
    } finally {
      setLoading(false)
    }
  }

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditing ? 'Edit Task' : 'Create Task'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={[styles.saveButton, loading && styles.disabledButton]}
        >
          <Text style={styles.saveText}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Task Title *</Text>
            <View style={styles.titleInputContainer}>
              <TouchableOpacity
                style={styles.emojiButton}
                onPress={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Text style={styles.emojiButtonText}>
                  {selectedEmoji || '😊'}
                </Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.input, styles.titleInput]}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter task title"
                autoCapitalize="sentences"
              />
            </View>
          </View>

          {showEmojiPicker && (
            <View style={styles.emojiPicker}>
              <Text style={styles.emojiPickerTitle}>Choose an emoji (optional)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.emojiScrollView}
              >
                <TouchableOpacity
                  style={[styles.emojiOption, !selectedEmoji && styles.selectedEmojiOption]}
                  onPress={() => {
                    setSelectedEmoji('')
                    setShowEmojiPicker(false)
                  }}
                >
                  <Text style={styles.emojiOptionText}>None</Text>
                </TouchableOpacity>
                {taskEmojis.map((emoji, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.emojiOption,
                      selectedEmoji === emoji && styles.selectedEmojiOption
                    ]}
                    onPress={() => {
                      setSelectedEmoji(emoji)
                      setShowEmojiPicker(false)
                    }}
                  >
                    <Text style={styles.emojiOptionEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Household Selector */}
          {households.length > 1 && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Household/Group</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedHouseholdId}
                  onValueChange={(value) => {
                    setSelectedHouseholdId(value)
                    const selectedHousehold = households.find(h => h.id === value)
                    setHousehold(selectedHousehold)
                    setAssigneeId('') // Reset assignee when household changes
                  }}
                  style={styles.picker}
                >
                  {households.map((household) => (
                    <Picker.Item
                      key={household.id}
                      label={`${household.name} ${household.type === 'group' ? '(Group)' : '(Household)'}`}
                      value={household.id}
                    />
                  ))}
                </Picker>
              </View>
              <Text style={styles.helperText}>
                {households.find(h => h.id === selectedHouseholdId)?.name} is currently selected
              </Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add task description (optional)"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Due Date</Text>

            {/* Quick Date Selection */}
            <View style={styles.quickDateContainer}>
              <TouchableOpacity
                style={styles.quickDateButton}
                onPress={() => setDueDate(new Date().toISOString().split('T')[0])}
              >
                <Text style={styles.quickDateText}>Today</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickDateButton}
                onPress={() => {
                  const tomorrow = new Date()
                  tomorrow.setDate(tomorrow.getDate() + 1)
                  setDueDate(tomorrow.toISOString().split('T')[0])
                }}
              >
                <Text style={styles.quickDateText}>Tomorrow</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickDateButton}
                onPress={() => {
                  const nextWeek = new Date()
                  nextWeek.setDate(nextWeek.getDate() + 7)
                  setDueDate(nextWeek.toISOString().split('T')[0])
                }}
              >
                <Text style={styles.quickDateText}>Next Week</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickDateButton, styles.clearButton]}
                onPress={() => setDueDate('')}
              >
                <Text style={[styles.quickDateText, styles.clearButtonText]}>Clear</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="YYYY-MM-DD (or use buttons above)"
            />

            {dueDate && (
              <Text style={styles.datePreview}>
                📅 Due: {new Date(dueDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            )}
          </View>

          {/* Random assignment switch removed - now part of assignment section */}

          <View style={styles.inputGroup}>
            <View style={styles.assignmentHeader}>
              <Text style={styles.label}>Task Assignment</Text>
              <TouchableOpacity
                style={styles.shuffleButton}
                onPress={() => {
                  if (householdMembers.length > 0) {
                    const randomMember = householdMembers[Math.floor(Math.random() * householdMembers.length)]
                    setAssigneeId(randomMember.user_id)
                    setRandomAssignment(false)
                    Alert.alert('🎲 Shuffled!', `Task assigned to ${randomMember.profiles?.name || 'Unknown'}`)
                  }
                }}
              >
                <Text style={styles.shuffleButtonText}>🎲 Shuffle</Text>
              </TouchableOpacity>
            </View>

            {/* Assignment Options */}
            <View style={styles.assignmentOptions}>
              <TouchableOpacity
                style={[
                  styles.assignmentOption,
                  randomAssignment && styles.assignmentOptionActive
                ]}
                onPress={() => {
                  setRandomAssignment(true)
                  setAssigneeId('')
                }}
              >
                <Text style={[
                  styles.assignmentOptionText,
                  randomAssignment && styles.assignmentOptionTextActive
                ]}>
                  🎲 Random Assignment
                </Text>
                <Text style={styles.assignmentOptionDescription}>
                  Let the app assign randomly
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.assignmentOption,
                  !randomAssignment && styles.assignmentOptionActive
                ]}
                onPress={() => setRandomAssignment(false)}
              >
                <Text style={[
                  styles.assignmentOptionText,
                  !randomAssignment && styles.assignmentOptionTextActive
                ]}>
                  👤 Specific Person
                </Text>
                <Text style={styles.assignmentOptionDescription}>
                  Choose who does this task
                </Text>
              </TouchableOpacity>
            </View>

            {!randomAssignment && (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={assigneeId}
                  onValueChange={setAssigneeId}
                  style={styles.picker}
                  enabled={householdMembers.length > 0}
                >
                  <Picker.Item
                    label={householdMembers.length === 0 ? "Loading members..." : "Select a person (optional)"}
                    value=""
                  />
                  {householdMembers.map((member) => (
                    <Picker.Item
                      key={member.user_id}
                      label={`${member.profiles?.name || member.profiles?.email || 'Unknown'} ${member.role === 'admin' ? '(Admin)' : ''}`}
                      value={member.user_id}
                    />
                  ))}
                </Picker>
                {householdMembers.length === 0 && selectedHouseholdId && (
                  <Text style={styles.helperText}>
                    Loading household members...
                  </Text>
                )}
                {householdMembers.length > 0 && (
                  <Text style={styles.helperText}>
                    {householdMembers.length} member{householdMembers.length !== 1 ? 's' : ''} available
                  </Text>
                )}
              </View>
            )}

            {randomAssignment && (
              <View style={styles.randomAssignmentInfo}>
                <Text style={styles.randomAssignmentText}>
                  🎲 This task will be assigned randomly to a household member when created
                </Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Repeat Task</Text>

            {/* Recurrence Selection Buttons */}
            <View style={styles.recurrenceContainer}>
              <TouchableOpacity
                style={[
                  styles.recurrenceButton,
                  recurrence === 'none' && styles.recurrenceButtonActive
                ]}
                onPress={() => setRecurrence('none')}
              >
                <Text style={[
                  styles.recurrenceButtonText,
                  recurrence === 'none' && styles.recurrenceButtonTextActive
                ]}>
                  🚫 No Repeat
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.recurrenceButton,
                  recurrence === 'daily' && styles.recurrenceButtonActive
                ]}
                onPress={() => setRecurrence('daily')}
              >
                <Text style={[
                  styles.recurrenceButtonText,
                  recurrence === 'daily' && styles.recurrenceButtonTextActive
                ]}>
                  📅 Daily
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.recurrenceButton,
                  recurrence === 'weekly' && styles.recurrenceButtonActive
                ]}
                onPress={() => setRecurrence('weekly')}
              >
                <Text style={[
                  styles.recurrenceButtonText,
                  recurrence === 'weekly' && styles.recurrenceButtonTextActive
                ]}>
                  📆 Weekly
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.recurrenceButton,
                  recurrence === 'monthly' && styles.recurrenceButtonActive
                ]}
                onPress={() => setRecurrence('monthly')}
              >
                <Text style={[
                  styles.recurrenceButtonText,
                  recurrence === 'monthly' && styles.recurrenceButtonTextActive
                ]}>
                  🗓️ Monthly
                </Text>
              </TouchableOpacity>
            </View>

            {recurrence !== 'none' && (
              <Text style={styles.recurrencePreview}>
                ✨ This task will repeat {recurrence}
              </Text>
            )}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💡 Task Tips</Text>
            <Text style={styles.infoText}>
              • Use clear, specific titles{'\n'}
              • Set due dates for time-sensitive tasks{'\n'}
              • Random assignment helps distribute work fairly{'\n'}
              • Recurring tasks are great for regular chores
            </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
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
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flex: 1,
    marginRight: 15,
  },
  switchDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  infoBox: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
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
  titleInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emojiButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiButtonText: {
    fontSize: 24,
  },
  titleInput: {
    flex: 1,
    marginBottom: 0,
  },
  emojiPicker: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  emojiPickerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  emojiScrollView: {
    flexDirection: 'row',
  },
  emojiOption: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  selectedEmojiOption: {
    borderColor: '#667eea',
    backgroundColor: '#f0f8ff',
  },
  emojiOptionEmoji: {
    fontSize: 24,
  },
  emojiOptionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  // Quick Date Selection Styles
  quickDateContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  quickDateButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  quickDateText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  clearButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  clearButtonText: {
    color: '#6c757d',
  },
  datePreview: {
    fontSize: 14,
    color: '#28a745',
    marginTop: 8,
    fontWeight: '500',
  },
  // Recurrence Button Styles
  recurrenceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  recurrenceButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e9ecef',
    marginRight: 8,
    marginBottom: 8,
  },
  recurrenceButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  recurrenceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
  },
  recurrenceButtonTextActive: {
    color: '#fff',
  },
  recurrencePreview: {
    fontSize: 14,
    color: '#667eea',
    marginTop: 8,
    fontWeight: '500',
  },
  // Assignment Section Styles
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  shuffleButton: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shuffleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  assignmentOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  assignmentOption: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  assignmentOptionActive: {
    backgroundColor: '#f8faff',
    borderColor: '#667eea',
  },
  assignmentOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 4,
  },
  assignmentOptionTextActive: {
    color: '#667eea',
  },
  assignmentOptionDescription: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  randomAssignmentInfo: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  randomAssignmentText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
})
