import { useEffect, useState } from 'react'
import {
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'

interface AdvancedSearchProps {
  visible: boolean
  onClose: () => void
  onApplyFilters: (filters: SearchFilters) => void
  type: 'tasks' | 'bills'
  currentFilters: SearchFilters
}

export interface SearchFilters {
  searchQuery: string
  dateRange: {
    start: string | null
    end: string | null
  }
  assignee: string | null
  status: string[]
  category: string | null
  amount: {
    min: number | null
    max: number | null
  }
  recurrence: string | null
  overdue: boolean
  hasReceipt: boolean | null
}

const defaultFilters: SearchFilters = {
  searchQuery: '',
  dateRange: { start: null, end: null },
  assignee: null,
  status: [],
  category: null,
  amount: { min: null, max: null },
  recurrence: null,
  overdue: false,
  hasReceipt: null,
}

export default function AdvancedSearchModal({
  visible,
  onClose,
  onApplyFilters,
  type,
  currentFilters
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>(currentFilters)

  useEffect(() => {
    setFilters(currentFilters)
  }, [currentFilters, visible])

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const updateDateRange = (key: 'start' | 'end', value: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, [key]: value }
    }))
  }

  const updateAmount = (key: 'min' | 'max', value: string) => {
    const numValue = value ? parseFloat(value) : null
    setFilters(prev => ({
      ...prev,
      amount: { ...prev.amount, [key]: numValue }
    }))
  }

  const toggleStatus = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }))
  }

  const resetFilters = () => {
    setFilters(defaultFilters)
  }

  const applyFilters = () => {
    onApplyFilters(filters)
    onClose()
  }

  const taskStatuses = ['pending', 'completed', 'awaiting_approval']
  const billStatuses = ['owed', 'paid', 'partially_paid']
  const recurrenceOptions = ['daily', 'weekly', 'monthly']
  const categories = ['Groceries', 'Utilities', 'Rent', 'Entertainment', 'Transportation', 'Other']

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Advanced Search</Text>
          <TouchableOpacity onPress={applyFilters}>
            <Text style={styles.applyButton}>Apply</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Search Query */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Search Text</Text>
            <TextInput
              style={styles.textInput}
              placeholder={`Search ${type}...`}
              value={filters.searchQuery}
              onChangeText={(value) => updateFilter('searchQuery', value)}
            />
          </View>

          {/* Date Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date Range</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateInput}>
                <Text style={styles.dateLabel}>From</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  value={filters.dateRange.start || ''}
                  onChangeText={(value) => updateDateRange('start', value)}
                />
              </View>
              <View style={styles.dateInput}>
                <Text style={styles.dateLabel}>To</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  value={filters.dateRange.end || ''}
                  onChangeText={(value) => updateDateRange('end', value)}
                />
              </View>
            </View>
          </View>

          {/* Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={styles.chipContainer}>
              {(type === 'tasks' ? taskStatuses : billStatuses).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.chip,
                    filters.status.includes(status) && styles.chipActive
                  ]}
                  onPress={() => toggleStatus(status)}
                >
                  <Text style={[
                    styles.chipText,
                    filters.status.includes(status) && styles.chipTextActive
                  ]}>
                    {status.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category (Bills only) */}
          {type === 'bills' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category</Text>
              <View style={styles.chipContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.chip,
                      filters.category === category && styles.chipActive
                    ]}
                    onPress={() => updateFilter('category', 
                      filters.category === category ? null : category
                    )}
                  >
                    <Text style={[
                      styles.chipText,
                      filters.category === category && styles.chipTextActive
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Amount Range (Bills only) */}
          {type === 'bills' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amount Range</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateInput}>
                  <Text style={styles.dateLabel}>Min $</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={filters.amount.min?.toString() || ''}
                    onChangeText={(value) => updateAmount('min', value)}
                  />
                </View>
                <View style={styles.dateInput}>
                  <Text style={styles.dateLabel}>Max $</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="999.99"
                    keyboardType="numeric"
                    value={filters.amount.max?.toString() || ''}
                    onChangeText={(value) => updateAmount('max', value)}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Recurrence (Tasks only) */}
          {type === 'tasks' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recurrence</Text>
              <View style={styles.chipContainer}>
                {recurrenceOptions.map((recurrence) => (
                  <TouchableOpacity
                    key={recurrence}
                    style={[
                      styles.chip,
                      filters.recurrence === recurrence && styles.chipActive
                    ]}
                    onPress={() => updateFilter('recurrence', 
                      filters.recurrence === recurrence ? null : recurrence
                    )}
                  >
                    <Text style={[
                      styles.chipText,
                      filters.recurrence === recurrence && styles.chipTextActive
                    ]}>
                      {recurrence}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Boolean Filters */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Filters</Text>
            
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Show only overdue</Text>
              <Switch
                value={filters.overdue}
                onValueChange={(value) => updateFilter('overdue', value)}
                trackColor={{ false: '#e5e7eb', true: '#667eea' }}
                thumbColor={filters.overdue ? '#fff' : '#f9fafb'}
              />
            </View>

            {type === 'bills' && (
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Has receipt</Text>
                <Switch
                  value={filters.hasReceipt === true}
                  onValueChange={(value) => updateFilter('hasReceipt', value ? true : null)}
                  trackColor={{ false: '#e5e7eb', true: '#667eea' }}
                  thumbColor={filters.hasReceipt === true ? '#fff' : '#f9fafb'}
                />
              </View>
            )}
          </View>

          {/* Reset Button */}
          <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
            <Text style={styles.resetButtonText}>Reset All Filters</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  applyButton: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  resetButton: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  resetButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
})
