import { router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
// Simple debounce implementation to avoid external dependency
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

interface SearchResult {
  id: string
  type: 'task' | 'bill' | 'member'
  title: string
  subtitle: string
  emoji: string
  date?: string
  amount?: number
  status?: string
}

export default function GlobalSearchScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [household, setHousehold] = useState<any>(null)
  const { user } = useAuth()

  useEffect(() => {
    fetchHousehold()
    loadRecentSearches()
  }, [])

  const fetchHousehold = async () => {
    try {
      const { data: householdMember } = await supabase
        .from('household_members')
        .select('household_id, households(id, name)')
        .eq('user_id', user?.id)
        .single()

      if (householdMember) {
        setHousehold(householdMember.households)
      }
    } catch (error) {
      console.error('Error fetching household:', error)
    }
  }

  const loadRecentSearches = () => {
    // In a real app, you'd load this from AsyncStorage
    setRecentSearches(['groceries', 'utilities', 'cleaning', 'rent'])
  }

  const saveRecentSearch = (query: string) => {
    if (query.trim() && !recentSearches.includes(query.trim())) {
      const updated = [query.trim(), ...recentSearches.slice(0, 9)]
      setRecentSearches(updated)
      // In a real app, you'd save this to AsyncStorage
    }
  }

  const performSearch = async (query: string) => {
    if (!query.trim() || !household) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const searchResults: SearchResult[] = []

      // Search tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          due_date,
          status,
          emoji,
          profiles!tasks_assignee_id_fkey(name)
        `)
        .eq('household_id', household.id)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10)

      tasks?.forEach(task => {
        searchResults.push({
          id: task.id,
          type: 'task',
          title: task.title,
          subtitle: task.profiles?.name ? `Assigned to ${task.profiles.name}` : 'Unassigned',
          emoji: task.emoji || '📋',
          date: task.due_date,
          status: task.status,
        })
      })

      // Search bills
      const { data: bills } = await supabase
        .from('bills')
        .select(`
          id,
          title,
          amount,
          date,
          category,
          profiles!bills_paid_by_fkey(name)
        `)
        .eq('household_id', household.id)
        .or(`title.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(10)

      bills?.forEach(bill => {
        searchResults.push({
          id: bill.id,
          type: 'bill',
          title: bill.title,
          subtitle: `Paid by ${bill.profiles?.name || 'Unknown'}`,
          emoji: getCategoryEmoji(bill.category),
          date: bill.date,
          amount: bill.amount,
        })
      })

      // Search household members
      const { data: members } = await supabase
        .from('household_members')
        .select(`
          user_id,
          role,
          profiles!household_members_user_id_fkey(id, name, email)
        `)
        .eq('household_id', household.id)

      const filteredMembers = members?.filter(member =>
        member.profiles?.name?.toLowerCase().includes(query.toLowerCase()) ||
        member.profiles?.email?.toLowerCase().includes(query.toLowerCase())
      )

      filteredMembers?.forEach(member => {
        searchResults.push({
          id: member.user_id,
          type: 'member',
          title: member.profiles?.name || 'Unknown',
          subtitle: member.profiles?.email || '',
          emoji: '👤',
          status: member.role,
        })
      })

      // Sort results by relevance (exact matches first, then partial)
      searchResults.sort((a, b) => {
        const aExact = a.title.toLowerCase() === query.toLowerCase()
        const bExact = b.title.toLowerCase() === query.toLowerCase()
        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1
        return a.title.localeCompare(b.title)
      })

      setResults(searchResults)
      saveRecentSearch(query)
    } catch (error) {
      console.error('Search error:', error)
      Alert.alert('Error', 'Failed to perform search')
    } finally {
      setLoading(false)
    }
  }

  const debouncedSearch = useCallback(
    debounce((query: string) => performSearch(query), 300),
    [household]
  )

  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery, debouncedSearch])

  const getCategoryEmoji = (category: string | null) => {
    switch (category?.toLowerCase()) {
      case 'groceries': return '🛒'
      case 'utilities': return '⚡'
      case 'rent': return '🏠'
      case 'entertainment': return '🎬'
      case 'transportation': return '🚗'
      default: return '💰'
    }
  }

  const getStatusColor = (type: string, status?: string) => {
    if (type === 'task') {
      switch (status) {
        case 'completed': return '#10b981'
        case 'pending': return '#f59e0b'
        case 'awaiting_approval': return '#3b82f6'
        default: return '#6b7280'
      }
    }
    return '#6b7280'
  }

  const handleResultPress = (result: SearchResult) => {
    switch (result.type) {
      case 'task':
        router.push(`/(app)/tasks/${result.id}`)
        break
      case 'bill':
        router.push(`/(app)/bills/${result.id}`)
        break
      case 'member':
        // Could navigate to member profile or show member details
        Alert.alert('Member', `${result.title}\n${result.subtitle}`)
        break
    }
  }

  const handleRecentSearchPress = (query: string) => {
    setSearchQuery(query)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setResults([])
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks, bills, and members..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}

        {!loading && searchQuery.trim() === '' && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔍</Text>
            <Text style={styles.emptyStateTitle}>Search Everything</Text>
            <Text style={styles.emptyStateText}>
              Find tasks, bills, and household members quickly
            </Text>

            {recentSearches.length > 0 && (
              <View style={styles.recentSearches}>
                <Text style={styles.recentTitle}>Recent Searches</Text>
                <View style={styles.recentChips}>
                  {recentSearches.map((search, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.recentChip}
                      onPress={() => handleRecentSearchPress(search)}
                    >
                      <Text style={styles.recentChipText}>{search}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {!loading && searchQuery.trim() !== '' && results.length === 0 && (
          <View style={styles.noResults}>
            <Text style={styles.noResultsIcon}>😔</Text>
            <Text style={styles.noResultsTitle}>No Results Found</Text>
            <Text style={styles.noResultsText}>
              Try searching with different keywords
            </Text>
          </View>
        )}

        {!loading && results.length > 0 && (
          <View style={styles.results}>
            <Text style={styles.resultsTitle}>
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </Text>
            
            {results.map((result) => (
              <TouchableOpacity
                key={`${result.type}-${result.id}`}
                style={styles.resultCard}
                onPress={() => handleResultPress(result)}
              >
                <View style={styles.resultHeader}>
                  <Text style={styles.resultEmoji}>{result.emoji}</Text>
                  <View style={styles.resultContent}>
                    <Text style={styles.resultTitle}>{result.title}</Text>
                    <Text style={styles.resultSubtitle}>{result.subtitle}</Text>
                  </View>
                  <View style={styles.resultMeta}>
                    <Text style={styles.resultType}>{result.type}</Text>
                    {result.status && (
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(result.type, result.status) }
                      ]}>
                        <Text style={styles.statusText}>{result.status}</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                {(result.date || result.amount) && (
                  <View style={styles.resultFooter}>
                    {result.date && (
                      <Text style={styles.resultDate}>
                        📅 {new Date(result.date).toLocaleDateString()}
                      </Text>
                    )}
                    {result.amount && (
                      <Text style={styles.resultAmount}>
                        💰 ${result.amount.toFixed(2)}
                      </Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    fontSize: 18,
    color: '#9ca3af',
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  recentSearches: {
    width: '100%',
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  recentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recentChipText: {
    fontSize: 14,
    color: '#666',
  },
  noResults: {
    alignItems: 'center',
    padding: 40,
  },
  noResultsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noResultsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  results: {
    padding: 20,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  resultEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  resultMeta: {
    alignItems: 'flex-end',
  },
  resultType: {
    fontSize: 12,
    color: '#9ca3af',
    textTransform: 'uppercase',
    fontWeight: '500',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  resultDate: {
    fontSize: 12,
    color: '#666',
  },
  resultAmount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
})
