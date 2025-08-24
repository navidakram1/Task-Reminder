import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  Platform,
} from 'react-native'
import { BlurView } from 'expo-blur'

export interface SelectorOption {
  label: string
  value: string
  subtitle?: string
  icon?: string
  disabled?: boolean
}

interface ModernSelectorProps {
  options: SelectorOption[]
  selectedValue?: string
  onValueChange: (value: string) => void
  placeholder?: string
  title?: string
  searchable?: boolean
  multiple?: boolean
  disabled?: boolean
  style?: any
}

export default function ModernSelector({
  options,
  selectedValue,
  onValueChange,
  placeholder = "Select an option",
  title = "Select Option",
  searchable = false,
  multiple = false,
  disabled = false,
  style
}: ModernSelectorProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const selectedOption = options.find(option => option.value === selectedValue)
  
  const filteredOptions = searchable 
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options

  const handleSelect = (value: string) => {
    onValueChange(value)
    setIsVisible(false)
    setSearchQuery('')
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.selector, disabled && styles.selectorDisabled, style]}
        onPress={() => !disabled && setIsVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.selectorContent}>
          {selectedOption ? (
            <View style={styles.selectedContent}>
              {selectedOption.icon && (
                <Text style={styles.selectedIcon}>{selectedOption.icon}</Text>
              )}
              <View style={styles.selectedTextContainer}>
                <Text style={styles.selectedText}>{selectedOption.label}</Text>
                {selectedOption.subtitle && (
                  <Text style={styles.selectedSubtitle}>{selectedOption.subtitle}</Text>
                )}
              </View>
            </View>
          ) : (
            <Text style={styles.placeholder}>{placeholder}</Text>
          )}
        </View>
        <Text style={[styles.arrow, disabled && styles.arrowDisabled]}>⌄</Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{title}</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Search */}
          {searchable && (
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search options..."
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
            </View>
          )}

          {/* Options List */}
          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    option.value === selectedValue && styles.selectedOption,
                    option.disabled && styles.disabledOption,
                    index === filteredOptions.length - 1 && styles.lastOption
                  ]}
                  onPress={() => !option.disabled && handleSelect(option.value)}
                  disabled={option.disabled}
                  activeOpacity={0.6}
                >
                  <View style={styles.optionContent}>
                    {option.icon && (
                      <Text style={styles.optionIcon}>{option.icon}</Text>
                    )}
                    <View style={styles.optionTextContainer}>
                      <Text style={[
                        styles.optionText,
                        option.value === selectedValue && styles.selectedOptionText,
                        option.disabled && styles.disabledOptionText
                      ]}>
                        {option.label}
                      </Text>
                      {option.subtitle && (
                        <Text style={[
                          styles.optionSubtitle,
                          option.disabled && styles.disabledOptionText
                        ]}>
                          {option.subtitle}
                        </Text>
                      )}
                    </View>
                  </View>
                  {option.value === selectedValue && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No options found</Text>
                {searchable && searchQuery && (
                  <Text style={styles.emptyStateSubtext}>
                    Try adjusting your search
                  </Text>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  selectorDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  selectorContent: {
    flex: 1,
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  selectedTextContainer: {
    flex: 1,
  },
  selectedText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  placeholder: {
    fontSize: 16,
    color: '#999',
  },
  arrow: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  arrowDisabled: {
    color: '#ccc',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  optionsList: {
    flex: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  selectedOption: {
    backgroundColor: '#f8f9ff',
  },
  disabledOption: {
    opacity: 0.5,
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  optionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#667eea',
    fontWeight: '600',
  },
  disabledOptionText: {
    color: '#999',
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 18,
    color: '#667eea',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
})
