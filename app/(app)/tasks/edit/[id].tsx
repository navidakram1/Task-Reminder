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
import MemberSelector from '../../../../components/MemberSelector'
import ModernSelector from '../../../../components/ModernSelector'
import { useAuth } from '../../../../contexts/AuthContext'
import { supabase } from '../../../../lib/supabase'

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams()
  const taskId = Array.isArray(id) ? id[0] : id
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none')
  const [selectedEmoji, setSelectedEmoji] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [householdMembers, setHouseholdMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [household, setHousehold] = useState<any>(null)
  const { user } = useAuth()

  // Common task emojis
  const taskEmojis = [
    '📋', '✅', '🏠', '🧹', '🍽️', '🛒', '🧺', '🚿', '🛏️', '🌱',
    '🔧', '💡', '📚', '💻', '🎯', '⚡', '🔥', '⭐', '🎉', '💪',
    '🏃', '🎵', '🎨', '📝', '📞', '💰', '🎁', '🍳', '🧽', '🪴'
  ]

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails()
      fetchHouseholdMembers()
    }
  }, [taskId])

  const fetchTaskDetails = async () => {
    if (!taskId) return

    try {
      const { data: task, error } = await supabase
        .from('tasks')
        .select(`
          *,
          households (
            id,
            name
          )
        `)
        .eq('id', taskId)
        .single()

      if (error) throw error

      if (task) {
        setTitle(task.title || '')
        setDescription(task.description || '')
        setDueDate(task.due_date || '')
        setAssigneeId(task.assigned_to || '')
        setRecurrence(task.recurrence || 'none')
        setSelectedEmoji(task.emoji || '')
        setPriority(task.priority || 'medium')
        setHousehold(task.households)
      }
    } catch (error: any) {
      console.error('Error fetching task:', error)
      Alert.alert('Error', 'Failed to load task details')
    }
  }

  const fetchHouseholdMembers = async () => {
    if (!user) return

    try {
      // Get user's household
      const { data: householdMember } = await supabase
        .from('household_members')
        .select(`
          household_id,
          households (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (!householdMember) return

      const householdId = householdMember.household_id

      // Get all household members
      const { data: members, error } = await supabase
        .from('household_members')
        .select(`
          user_id,
          role,
          profiles (
            id,
            name,
            email
          )
        `)
        .eq('household_id', householdId)

      if (error) throw error

      setHouseholdMembers(members || [])
      setHousehold(householdMember.households)
    } catch (error: any) {
      console.error('Error fetching household members:', error)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title')
      return
    }

    if (!taskId) {
      Alert.alert('Error', 'Task ID not found')
      return
    }

    setLoading(true)

    try {
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate || null,
        assigned_to: assigneeId || null,
        recurrence,
        emoji: selectedEmoji,
        priority,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', taskId)

      if (error) throw error

      Alert.alert('Success', 'Task updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ])
    } catch (error: any) {
      console.error('Error updating task:', error)
      Alert.alert('Error', error.message || 'Failed to update task')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() }
      ]
    )
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toISOString().split('T')[0] // YYYY-MM-DD format
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Task</Text>
        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Emoji Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task Icon</Text>
          <TouchableOpacity 
            style={styles.emojiButton}
            onPress={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Text style={styles.selectedEmoji}>
              {selectedEmoji || '📋'}
            </Text>
            <Text style={styles.emojiButtonText}>Tap to change</Text>
          </TouchableOpacity>

          {showEmojiPicker && (
            <View style={styles.emojiGrid}>
              {taskEmojis.map((emoji, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.emojiOption,
                    selectedEmoji === emoji && styles.emojiOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedEmoji(emoji)
                    setShowEmojiPicker(false)
                  }}
                >
                  <Text style={styles.emojiOptionText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Task Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter task title"
            placeholderTextColor="#999"
            maxLength={100}
          />
        </View>

        {/* Task Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter task description (optional)"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>

        {/* Due Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Due Date</Text>
          <TextInput
            style={styles.input}
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="YYYY-MM-DD (optional)"
            placeholderTextColor="#999"
          />
        </View>

        {/* Priority Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority</Text>
          <View style={styles.priorityContainer}>
            {(['low', 'medium', 'high'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.priorityOption,
                  priority === level && styles.priorityOptionSelected,
                  priority === level && level === 'low' && styles.priorityLow,
                  priority === level && level === 'medium' && styles.priorityMedium,
                  priority === level && level === 'high' && styles.priorityHigh,
                ]}
                onPress={() => setPriority(level)}
              >
                <Text style={[
                  styles.priorityText,
                  priority === level && styles.priorityTextSelected
                ]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Assignee Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assign To</Text>
          <MemberSelector
            members={householdMembers}
            selectedMemberId={assigneeId}
            onMemberChange={setAssigneeId}
            placeholder="Select a person"
            title="Assign To"
            allowUnassigned={true}
          />
        </View>

        {/* Recurrence */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Repeat</Text>
          <ModernSelector
            options={[
              { label: 'No Repeat', value: 'none', icon: '🚫', subtitle: 'One-time task' },
              { label: 'Daily', value: 'daily', icon: '📅', subtitle: 'Repeats every day' },
              { label: 'Weekly', value: 'weekly', icon: '📆', subtitle: 'Repeats every week' },
              { label: 'Monthly', value: 'monthly', icon: '🗓️', subtitle: 'Repeats every month' }
            ]}
            selectedValue={recurrence}
            onValueChange={setRecurrence}
            placeholder="Select repeat frequency"
            title="Repeat Frequency"
          />
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#667eea',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#667eea',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  emojiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  emojiButtonText: {
    fontSize: 16,
    color: '#666',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  emojiOption: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderRadius: 8,
  },
  emojiOptionSelected: {
    backgroundColor: '#667eea',
  },
  emojiOptionText: {
    fontSize: 20,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  priorityOptionSelected: {
    borderWidth: 2,
  },
  priorityLow: {
    borderColor: '#28a745',
    backgroundColor: '#f8fff9',
  },
  priorityMedium: {
    borderColor: '#ffc107',
    backgroundColor: '#fffef8',
  },
  priorityHigh: {
    borderColor: '#dc3545',
    backgroundColor: '#fff8f8',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  priorityTextSelected: {
    color: '#333',
    fontWeight: '600',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
})
