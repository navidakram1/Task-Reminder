# 🛒 Shopping System - Integration Guide

## How to Access Shopping System from Other Pages

### 1. Navigate to Shopping Lists
```typescript
import { router } from 'expo-router'

// From any page, navigate to shopping lists
router.push('/(app)/shopping')
```

### 2. Navigate to Specific Shopping List
```typescript
import { router } from 'expo-router'

// Navigate to a specific list by ID
const listId = 'your-list-id'
router.push(`/(app)/shopping/${listId}`)
```

### 3. Navigate to Create Shopping List
```typescript
import { router } from 'expo-router'

// Navigate to create new list
router.push('/(app)/shopping/create')
```

---

## Adding Shopping Button to Dashboard

### Example: Add Shopping Button to Dashboard
```typescript
import { router } from 'expo-router'
import { TouchableOpacity, Text } from 'react-native'
import { APP_THEME } from '@/constants/AppTheme'

export function ShoppingButton() {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => router.push('/(app)/shopping')}
    >
      <Text style={styles.buttonText}>🛒 Shopping Lists</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: APP_THEME.colors.primary,
    paddingHorizontal: APP_THEME.spacing.lg,
    paddingVertical: APP_THEME.spacing.base,
    borderRadius: APP_THEME.borderRadius.base,
  },
  buttonText: {
    color: APP_THEME.colors.surface,
    fontWeight: APP_THEME.typography.fontWeight.semibold,
    fontSize: APP_THEME.typography.fontSize.base,
  },
})
```

---

## Adding Shopping to Bottom Navigation

### Option 1: Add as Main Tab
```typescript
// In app/(app)/_layout.tsx

<Tabs.Screen
  name="shopping"
  options={{
    title: 'Shopping',
    // Icon configuration would go here
  }}
/>
```

### Option 2: Add as Quick Action
```typescript
// In your dashboard or home page

<TouchableOpacity
  onPress={() => router.push('/(app)/shopping')}
  style={styles.quickAction}
>
  <Text style={styles.icon}>🛒</Text>
  <Text style={styles.label}>Shopping</Text>
</TouchableOpacity>
```

---

## Creating Shopping List from Other Pages

### Example: Create List from Dashboard
```typescript
import { useState } from 'react'
import { Alert, TouchableOpacity, Text, TextInput, View } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { APP_THEME } from '@/constants/AppTheme'

export function QuickCreateShoppingList() {
  const { user } = useAuth()
  const [listName, setListName] = useState('')
  const [loading, setLoading] = useState(false)

  const createList = async () => {
    if (!listName.trim() || !user) return

    setLoading(true)
    try {
      const { data: householdData } = await supabase.rpc('get_default_household')
      if (!householdData?.[0]) {
        Alert.alert('Error', 'You must be part of a household')
        return
      }

      const { data, error } = await supabase
        .from('shopping_lists')
        .insert([
          {
            name: listName.trim(),
            household_id: householdData[0].household_id,
            created_by: user.id,
          },
        ])
        .select()

      if (error) throw error

      Alert.alert('Success', 'Shopping list created!')
      setListName('')
      // Navigate to the new list
      router.push(`/(app)/shopping/${data[0].id}`)
    } catch (error) {
      Alert.alert('Error', 'Failed to create shopping list')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="New shopping list..."
        value={listName}
        onChangeText={setListName}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={createList}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Creating...' : 'Create'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}
```

---

## Fetching Shopping Lists Programmatically

### Get All Shopping Lists
```typescript
import { supabase } from '@/lib/supabase'

async function getShoppingLists(householdId: string) {
  const { data, error } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
```

### Get Shopping List Items
```typescript
async function getShoppingItems(listId: string) {
  const { data, error } = await supabase
    .from('shopping_items')
    .select('*')
    .eq('list_id', listId)
    .order('completed', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
```

### Get List Statistics
```typescript
async function getListStats(listId: string) {
  const { data, error } = await supabase
    .from('shopping_items')
    .select('completed')
    .eq('list_id', listId)

  if (error) throw error

  const total = data?.length || 0
  const completed = data?.filter(item => item.completed).length || 0

  return {
    total,
    completed,
    percentage: total > 0 ? (completed / total) * 100 : 0,
  }
}
```

---

## Adding Shopping Widget to Dashboard

### Example: Shopping Lists Widget
```typescript
import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, FlatList } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { APP_THEME } from '@/constants/AppTheme'

export function ShoppingWidget({ householdId }: { householdId: string }) {
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLists()
  }, [householdId])

  const fetchLists = async () => {
    try {
      const { data } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('household_id', householdId)
        .limit(3)
        .order('created_at', { ascending: false })

      setLists(data || [])
    } catch (error) {
      console.error('Error fetching lists:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.widget}>
      <View style={styles.header}>
        <Text style={styles.title}>🛒 Shopping Lists</Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/shopping')}
        >
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      {lists.length === 0 ? (
        <Text style={styles.emptyText}>No shopping lists yet</Text>
      ) : (
        <FlatList
          data={lists}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.listItem}
              onPress={() => router.push(`/(app)/shopping/${item.id}`)}
            >
              <Text style={styles.listName}>{item.name}</Text>
              <Text style={styles.listMeta}>→</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  widget: {
    backgroundColor: APP_THEME.colors.surface,
    borderRadius: APP_THEME.borderRadius.base,
    padding: APP_THEME.spacing.lg,
    marginBottom: APP_THEME.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: APP_THEME.spacing.base,
  },
  title: {
    fontSize: APP_THEME.typography.fontSize.lg,
    fontWeight: APP_THEME.typography.fontWeight.bold,
    color: APP_THEME.colors.textPrimary,
  },
  viewAll: {
    fontSize: APP_THEME.typography.fontSize.sm,
    color: APP_THEME.colors.primary,
    fontWeight: APP_THEME.typography.fontWeight.semibold,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: APP_THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.border,
  },
  listName: {
    fontSize: APP_THEME.typography.fontSize.base,
    color: APP_THEME.colors.textPrimary,
  },
  listMeta: {
    fontSize: APP_THEME.typography.fontSize.base,
    color: APP_THEME.colors.textTertiary,
  },
  emptyText: {
    fontSize: APP_THEME.typography.fontSize.sm,
    color: APP_THEME.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: APP_THEME.spacing.base,
  },
})
```

---

## Real-time Updates with Supabase Subscriptions

### Subscribe to Shopping List Changes
```typescript
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useShoppingListSubscription(listId: string) {
  useEffect(() => {
    const subscription = supabase
      .channel(`shopping_items:${listId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_items',
          filter: `list_id=eq.${listId}`,
        },
        (payload) => {
          console.log('Shopping items updated:', payload)
          // Update your state here
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [listId])
}
```

---

## Error Handling

### Common Errors and Solutions

**Error: "Unable to resolve household"**
```typescript
// Solution: Ensure user is part of a household
const { data: householdData } = await supabase.rpc('get_default_household')
if (!householdData?.[0]) {
  Alert.alert('Error', 'You must be part of a household first')
  return
}
```

**Error: "Permission denied"**
```typescript
// Solution: Check RLS policies and user permissions
// Verify user is in the household
// Verify household_id matches
```

**Error: "List not found"**
```typescript
// Solution: Verify list ID is correct
// Check list belongs to user's household
```

---

## Best Practices

1. **Always check household membership** before creating lists
2. **Use error boundaries** for better error handling
3. **Implement loading states** for better UX
4. **Cache household ID** to avoid repeated queries
5. **Use real-time subscriptions** for collaborative features
6. **Validate input** before submitting to database
7. **Handle offline scenarios** gracefully
8. **Test with multiple users** to verify permissions

---

## API Reference

### Routes
- `/(app)/shopping` - Shopping lists overview
- `/(app)/shopping/[id]` - Shopping list detail
- `/(app)/shopping/create` - Create new list

### Database Tables
- `shopping_lists` - Shopping list metadata
- `shopping_items` - Individual shopping items

### Key Functions
- `fetchShoppingLists()` - Get all lists
- `addItem()` - Add item to list
- `toggleItem()` - Mark item complete
- `deleteItem()` - Remove item
- `deleteList()` - Remove list

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-27  
**Status**: ✅ Complete

