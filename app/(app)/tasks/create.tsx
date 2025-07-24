import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { Picker } from '@react-native-picker/picker'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../contexts/AuthContext'

export default function CreateEditTaskScreen() {
  const { edit } = useLocalSearchParams()
  const isEditing = !!edit
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none')
  const [randomAssignment, setRandomAssignment] = useState(false)
  const [householdMembers, setHouseholdMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [household, setHousehold] = useState<any>(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchHouseholdMembers()
    if (isEditing) {
      fetchTaskDetails()
    }
  }, [])

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
        .single()

      if (!householdMember?.households) return
      setHousehold(householdMember.households)

      // Get all household members
      const { data: members } = await supabase
        .from('household_members')
        .select(`
          user_id,
          profiles (
            id,
            name,
            email
          )
        `)
        .eq('household_id', householdMember.household_id)

      setHouseholdMembers(members || [])
    } catch (error) {
      console.error('Error fetching household members:', error)
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

    if (!household) {
      Alert.alert('Error', 'No household found')
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
        household_id: household.id,
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
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter task title"
              autoCapitalize="sentences"
            />
          </View>

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
            <TextInput
              style={styles.input}
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="YYYY-MM-DD (optional)"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={styles.label}>Random Assignment</Text>
                <Text style={styles.switchDescription}>
                  Let the app assign this task randomly
                </Text>
              </View>
              <Switch
                value={randomAssignment}
                onValueChange={setRandomAssignment}
                trackColor={{ false: '#ddd', true: '#667eea' }}
                thumbColor={randomAssignment ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          {!randomAssignment && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Assign To</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={assigneeId}
                  onValueChange={setAssigneeId}
                  style={styles.picker}
                >
                  <Picker.Item label="Select a person (optional)" value="" />
                  {householdMembers.map((member) => (
                    <Picker.Item
                      key={member.user_id}
                      label={member.profiles?.name || member.profiles?.email || 'Unknown'}
                      value={member.user_id}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Recurrence</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={recurrence}
                onValueChange={setRecurrence}
                style={styles.picker}
              >
                <Picker.Item label="No recurrence" value="none" />
                <Picker.Item label="Daily" value="daily" />
                <Picker.Item label="Weekly" value="weekly" />
                <Picker.Item label="Monthly" value="monthly" />
              </Picker>
            </View>
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
})
