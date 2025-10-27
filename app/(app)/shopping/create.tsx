import { router } from 'expo-router'
import { useState } from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'
import { APP_THEME } from '../../../constants/AppTheme'

const CATEGORIES = [
  '🥬 Groceries',
  '🧼 Household',
  '🏥 Health',
  '👕 Clothing',
  '🎮 Electronics',
  '📚 Books',
  '🍽️ Kitchen',
  '🧸 Other',
]

export default function CreateShoppingListScreen() {
  const { user } = useAuth()
  const [listName, setListName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0])
  const [loading, setLoading] = useState(false)

  const createList = async () => {
    if (!listName.trim() || !user) {
      Alert.alert('Error', 'Please enter a list name')
      return
    }

    setLoading(true)
    try {
      // Get user's household
      const { data: householdData } = await supabase.rpc('get_default_household')
      if (!householdData || householdData.length === 0) {
        Alert.alert('Error', 'You must be part of a household')
        setLoading(false)
        return
      }

      const householdId = householdData[0].household_id

      // Create shopping list
      const { data, error } = await supabase
        .from('shopping_lists')
        .insert([
          {
            name: listName.trim(),
            description: description.trim() || null,
            household_id: householdId,
            created_by: user.id,
          },
        ])
        .select()

      if (error) throw error

      Alert.alert('Success', 'Shopping list created!', [
        {
          text: 'OK',
          onPress: () => {
            router.push(`/(app)/shopping/${data[0].id}`)
          },
        },
      ])
    } catch (error) {
      console.error('Error creating list:', error)
      Alert.alert('Error', 'Failed to create shopping list')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>List Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Weekly Groceries"
            placeholderTextColor={APP_THEME.colors.textTertiary}
            value={listName}
            onChangeText={setListName}
            editable={!loading}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add notes about this list..."
            placeholderTextColor={APP_THEME.colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            editable={!loading}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category &&
                    styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category)}
                disabled={loading}
              >
                <Text style={styles.categoryText}>{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.hint}>
            💡 Tip: You can add items to this list after creating it.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.createButton, loading && styles.buttonDisabled]}
          onPress={createList}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating...' : 'Create List'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
  },
  content: {
    padding: APP_THEME.spacing.lg,
    gap: APP_THEME.spacing.lg,
  },
  section: {
    gap: APP_THEME.spacing.sm,
  },
  label: {
    fontSize: APP_THEME.typography.fontSize.base,
    fontWeight: APP_THEME.typography.fontWeight.semibold,
    color: APP_THEME.colors.textPrimary,
  },
  input: {
    backgroundColor: APP_THEME.colors.surface,
    borderRadius: APP_THEME.borderRadius.base,
    paddingHorizontal: APP_THEME.spacing.base,
    paddingVertical: APP_THEME.spacing.base,
    fontSize: APP_THEME.typography.fontSize.base,
    color: APP_THEME.colors.textPrimary,
    borderWidth: 1,
    borderColor: APP_THEME.colors.border,
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: APP_THEME.spacing.sm,
  },
  categoryButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: APP_THEME.colors.surface,
    borderRadius: APP_THEME.borderRadius.base,
    paddingVertical: APP_THEME.spacing.base,
    paddingHorizontal: APP_THEME.spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: APP_THEME.colors.border,
  },
  categoryButtonActive: {
    borderColor: APP_THEME.colors.primary,
    backgroundColor: APP_THEME.colors.background,
  },
  categoryText: {
    fontSize: APP_THEME.typography.fontSize.sm,
    fontWeight: APP_THEME.typography.fontWeight.medium,
    color: APP_THEME.colors.textPrimary,
  },
  hint: {
    fontSize: APP_THEME.typography.fontSize.sm,
    color: APP_THEME.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: APP_THEME.spacing.base,
  },
  footer: {
    flexDirection: 'row',
    gap: APP_THEME.spacing.base,
    padding: APP_THEME.spacing.lg,
    backgroundColor: APP_THEME.colors.surface,
    borderTopWidth: 1,
    borderTopColor: APP_THEME.colors.border,
  },
  button: {
    flex: 1,
    paddingVertical: APP_THEME.spacing.base,
    borderRadius: APP_THEME.borderRadius.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: APP_THEME.colors.background,
    borderWidth: 1,
    borderColor: APP_THEME.colors.border,
  },
  cancelButtonText: {
    color: APP_THEME.colors.textPrimary,
    fontWeight: APP_THEME.typography.fontWeight.semibold,
    fontSize: APP_THEME.typography.fontSize.base,
  },
  createButton: {
    backgroundColor: APP_THEME.colors.primary,
  },
  createButtonText: {
    color: APP_THEME.colors.surface,
    fontWeight: APP_THEME.typography.fontWeight.semibold,
    fontSize: APP_THEME.typography.fontSize.base,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
})

