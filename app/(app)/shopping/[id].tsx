import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'
import { APP_THEME } from '../../../constants/AppTheme'

interface ShoppingItem {
  id: string
  list_id: string
  name: string
  quantity?: string
  category?: string
  completed: boolean
  created_at: string
}

export default function ShoppingListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()
  const { user } = useAuth()

  const [listName, setListName] = useState('')
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [newItemName, setNewItemName] = useState('')
  const [newItemQuantity, setNewItemQuantity] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (id) {
      fetchListDetails()
    }
  }, [id])

  const fetchListDetails = async () => {
    if (!id) return

    try {
      // Fetch list details
      const { data: listData, error: listError } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('id', id)
        .single()

      if (listError) throw listError
      setListName(listData.name)

      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('list_id', id)
        .order('completed', { ascending: true })
        .order('created_at', { ascending: false })

      if (itemsError) throw itemsError
      setItems(itemsData || [])
    } catch (error) {
      console.error('Error fetching list details:', error)
      Alert.alert('Error', 'Failed to load shopping list')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchListDetails()
    setRefreshing(false)
  }

  const addItem = async () => {
    if (!newItemName.trim() || !id) return

    try {
      const { data, error } = await supabase
        .from('shopping_items')
        .insert([
          {
            list_id: id,
            name: newItemName.trim(),
            quantity: newItemQuantity.trim() || null,
            completed: false,
          },
        ])
        .select()

      if (error) throw error

      setItems([...items, data[0]])
      setNewItemName('')
      setNewItemQuantity('')
    } catch (error) {
      console.error('Error adding item:', error)
      Alert.alert('Error', 'Failed to add item')
    }
  }

  const toggleItem = async (itemId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('shopping_items')
        .update({ completed: !completed })
        .eq('id', itemId)

      if (error) throw error

      setItems(
        items.map((item) =>
          item.id === itemId ? { ...item, completed: !completed } : item
        )
      )
    } catch (error) {
      console.error('Error updating item:', error)
    }
  }

  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      setItems(items.filter((item) => item.id !== itemId))
    } catch (error) {
      console.error('Error deleting item:', error)
      Alert.alert('Error', 'Failed to delete item')
    }
  }

  const renderItem = ({ item }: { item: ShoppingItem }) => (
    <View style={styles.itemCard}>
      <TouchableOpacity
        style={[
          styles.checkbox,
          item.completed && styles.checkboxChecked,
        ]}
        onPress={() => toggleItem(item.id, item.completed)}
      >
        {item.completed && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>

      <View style={styles.itemContent}>
        <Text
          style={[
            styles.itemName,
            item.completed && styles.itemNameCompleted,
          ]}
        >
          {item.name}
        </Text>
        {item.quantity && (
          <Text style={styles.itemQuantity}>{item.quantity}</Text>
        )}
      </View>

      <TouchableOpacity
        onPress={() => {
          Alert.alert('Delete Item', 'Remove this item?', [
            { text: 'Cancel' },
            {
              text: 'Delete',
              onPress: () => deleteItem(item.id),
              style: 'destructive',
            },
          ])
        }}
      >
        <Text style={styles.deleteIcon}>✕</Text>
      </TouchableOpacity>
    </View>
  )

  const completedCount = items.filter((i) => i.completed).length

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{listName}</Text>
        <Text style={styles.headerSubtitle}>
          {completedCount} of {items.length} completed
        </Text>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No items yet</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Item name"
          placeholderTextColor={APP_THEME.colors.textTertiary}
          value={newItemName}
          onChangeText={setNewItemName}
        />
        <TextInput
          style={[styles.input, styles.quantityInput]}
          placeholder="Qty"
          placeholderTextColor={APP_THEME.colors.textTertiary}
          value={newItemQuantity}
          onChangeText={setNewItemQuantity}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={addItem}
          disabled={!newItemName.trim()}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
  },
  header: {
    backgroundColor: APP_THEME.colors.surface,
    paddingHorizontal: APP_THEME.spacing.lg,
    paddingVertical: APP_THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.border,
  },
  headerTitle: {
    fontSize: APP_THEME.typography.fontSize.xl,
    fontWeight: APP_THEME.typography.fontWeight.bold,
    color: APP_THEME.colors.textPrimary,
    marginBottom: APP_THEME.spacing.xs,
  },
  headerSubtitle: {
    fontSize: APP_THEME.typography.fontSize.sm,
    color: APP_THEME.colors.textSecondary,
  },
  listContent: {
    padding: APP_THEME.spacing.lg,
    gap: APP_THEME.spacing.sm,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_THEME.colors.surface,
    borderRadius: APP_THEME.borderRadius.base,
    padding: APP_THEME.spacing.base,
    gap: APP_THEME.spacing.base,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: APP_THEME.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: APP_THEME.colors.success,
    borderColor: APP_THEME.colors.success,
  },
  checkmark: {
    color: APP_THEME.colors.surface,
    fontWeight: 'bold',
    fontSize: 14,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: APP_THEME.typography.fontSize.base,
    fontWeight: APP_THEME.typography.fontWeight.medium,
    color: APP_THEME.colors.textPrimary,
  },
  itemNameCompleted: {
    textDecorationLine: 'line-through',
    color: APP_THEME.colors.textTertiary,
  },
  itemQuantity: {
    fontSize: APP_THEME.typography.fontSize.xs,
    color: APP_THEME.colors.textSecondary,
    marginTop: APP_THEME.spacing.xs,
  },
  deleteIcon: {
    fontSize: 18,
    color: APP_THEME.colors.error,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: APP_THEME.spacing.xl,
  },
  emptyStateText: {
    fontSize: APP_THEME.typography.fontSize.base,
    color: APP_THEME.colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: APP_THEME.spacing.sm,
    padding: APP_THEME.spacing.lg,
    backgroundColor: APP_THEME.colors.surface,
    borderTopWidth: 1,
    borderTopColor: APP_THEME.colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
    borderRadius: APP_THEME.borderRadius.base,
    paddingHorizontal: APP_THEME.spacing.base,
    paddingVertical: APP_THEME.spacing.sm,
    fontSize: APP_THEME.typography.fontSize.base,
    color: APP_THEME.colors.textPrimary,
  },
  quantityInput: {
    flex: 0.3,
  },
  addButton: {
    backgroundColor: APP_THEME.colors.primary,
    width: 44,
    height: 44,
    borderRadius: APP_THEME.borderRadius.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: APP_THEME.colors.surface,
    fontSize: 24,
    fontWeight: 'bold',
  },
})

