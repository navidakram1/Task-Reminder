import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'
import { APP_THEME } from '../../../constants/AppTheme'

interface ShoppingList {
  id: string
  name: string
  description?: string
  household_id: string
  created_by: string
  item_count: number
  completed_count: number
  created_at: string
}

export default function ShoppingListsScreen() {
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchShoppingLists()
  }, [])

  const fetchShoppingLists = async () => {
    if (!user) return

    try {
      // Get user's household
      const { data: householdData } = await supabase.rpc('get_default_household')
      if (!householdData || householdData.length === 0) {
        setLoading(false)
        return
      }

      const householdId = householdData[0].household_id

      // Fetch shopping lists
      const { data: listsData, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get item counts for each list
      const listsWithCounts = await Promise.all(
        (listsData || []).map(async (list) => {
          const { count: totalCount } = await supabase
            .from('shopping_items')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', list.id)

          const { count: completedCount } = await supabase
            .from('shopping_items')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', list.id)
            .eq('completed', true)

          return {
            ...list,
            item_count: totalCount || 0,
            completed_count: completedCount || 0,
          }
        })
      )

      setLists(listsWithCounts)
    } catch (error) {
      console.error('Error fetching shopping lists:', error)
      Alert.alert('Error', 'Failed to load shopping lists')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchShoppingLists()
    setRefreshing(false)
  }

  const deleteList = async (listId: string) => {
    try {
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', listId)

      if (error) throw error

      setLists(lists.filter((l) => l.id !== listId))
      Alert.alert('Success', 'Shopping list deleted')
    } catch (error) {
      console.error('Error deleting list:', error)
      Alert.alert('Error', 'Failed to delete shopping list')
    }
  }

  const renderListItem = ({ item }: { item: ShoppingList }) => (
    <TouchableOpacity
      style={styles.listCard}
      onPress={() => router.push(`/(app)/shopping/${item.id}`)}
    >
      <View style={styles.listHeader}>
        <View style={styles.listInfo}>
          <Text style={styles.listName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.listDescription}>{item.description}</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => {
            Alert.alert('Delete List', 'Are you sure?', [
              { text: 'Cancel', onPress: () => {} },
              {
                text: 'Delete',
                onPress: () => deleteList(item.id),
                style: 'destructive',
              },
            ])
          }}
        >
          <Text style={styles.deleteButton}>⋯</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{item.item_count}</Text>
          <Text style={styles.statLabel}>Items</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{item.completed_count}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${
                  item.item_count > 0
                    ? (item.completed_count / item.item_count) * 100
                    : 0
                }%`,
              },
            ]}
          />
        </View>
      </View>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading shopping lists...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛒 Shopping Lists</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/(app)/shopping/create')}
        >
          <Text style={styles.createButtonText}>+ New List</Text>
        </TouchableOpacity>
      </View>

      {lists.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🛍️</Text>
          <Text style={styles.emptyStateTitle}>No Shopping Lists</Text>
          <Text style={styles.emptyStateText}>
            Create your first shopping list to get started
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => router.push('/(app)/shopping/create')}
          >
            <Text style={styles.emptyStateButtonText}>Create List</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={lists}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: APP_THEME.spacing.lg,
    paddingVertical: APP_THEME.spacing.lg,
    backgroundColor: APP_THEME.colors.surface,
  },
  headerTitle: {
    fontSize: APP_THEME.typography.fontSize.xxl,
    fontWeight: APP_THEME.typography.fontWeight.bold,
    color: APP_THEME.colors.textPrimary,
  },
  createButton: {
    backgroundColor: APP_THEME.colors.primary,
    paddingHorizontal: APP_THEME.spacing.base,
    paddingVertical: APP_THEME.spacing.sm,
    borderRadius: APP_THEME.borderRadius.base,
  },
  createButtonText: {
    color: APP_THEME.colors.surface,
    fontWeight: APP_THEME.typography.fontWeight.semibold,
    fontSize: APP_THEME.typography.fontSize.sm,
  },
  listContainer: {
    padding: APP_THEME.spacing.lg,
    gap: APP_THEME.spacing.base,
  },
  listCard: {
    backgroundColor: APP_THEME.colors.surface,
    borderRadius: APP_THEME.borderRadius.base,
    padding: APP_THEME.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: APP_THEME.colors.primary,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: APP_THEME.spacing.base,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: APP_THEME.typography.fontSize.lg,
    fontWeight: APP_THEME.typography.fontWeight.bold,
    color: APP_THEME.colors.textPrimary,
    marginBottom: APP_THEME.spacing.xs,
  },
  listDescription: {
    fontSize: APP_THEME.typography.fontSize.sm,
    color: APP_THEME.colors.textSecondary,
  },
  deleteButton: {
    fontSize: 20,
    color: APP_THEME.colors.textTertiary,
  },
  listStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: APP_THEME.spacing.base,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: APP_THEME.typography.fontSize.lg,
    fontWeight: APP_THEME.typography.fontWeight.bold,
    color: APP_THEME.colors.primary,
  },
  statLabel: {
    fontSize: APP_THEME.typography.fontSize.xs,
    color: APP_THEME.colors.textSecondary,
    marginTop: APP_THEME.spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: APP_THEME.colors.border,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: APP_THEME.colors.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: APP_THEME.colors.success,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: APP_THEME.typography.fontSize.base,
    color: APP_THEME.colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: APP_THEME.spacing.lg,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: APP_THEME.spacing.lg,
  },
  emptyStateTitle: {
    fontSize: APP_THEME.typography.fontSize.xl,
    fontWeight: APP_THEME.typography.fontWeight.bold,
    color: APP_THEME.colors.textPrimary,
    marginBottom: APP_THEME.spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: APP_THEME.typography.fontSize.base,
    color: APP_THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: APP_THEME.spacing.lg,
  },
  emptyStateButton: {
    backgroundColor: APP_THEME.colors.primary,
    paddingHorizontal: APP_THEME.spacing.xl,
    paddingVertical: APP_THEME.spacing.base,
    borderRadius: APP_THEME.borderRadius.lg,
  },
  emptyStateButtonText: {
    color: APP_THEME.colors.surface,
    fontWeight: APP_THEME.typography.fontWeight.semibold,
    fontSize: APP_THEME.typography.fontSize.base,
  },
})

