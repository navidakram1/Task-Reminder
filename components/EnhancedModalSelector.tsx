import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { AnimatedModal } from './AnimatedModal'

interface Option {
  id: string
  label: string
  icon?: string
}

interface EnhancedModalSelectorProps {
  visible: boolean
  onClose: () => void
  onSelect: (option: Option) => void
  options: Option[]
  title: string
  searchable?: boolean
  animationType?: 'slide' | 'fade' | 'spring'
}

export const EnhancedModalSelector: React.FC<EnhancedModalSelectorProps> = ({
  visible,
  onClose,
  onSelect,
  options,
  title,
  searchable = true,
  animationType = 'slide',
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredOptions, setFilteredOptions] = useState(options)
  const itemAnimations = useRef<{ [key: string]: Animated.Value }>({}).current

  useEffect(() => {
    const filtered = options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredOptions(filtered)
  }, [searchQuery, options])

  const handleSelect = (option: Option) => {
    onSelect(option)
    onClose()
  }

  const renderOption = (item: Option, index: number) => {
    if (!itemAnimations[item.id]) {
      itemAnimations[item.id] = new Animated.Value(0)
      Animated.timing(itemAnimations[item.id], {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }).start()
    }

    const anim = itemAnimations[item.id]
    const opacity = anim
    const translateX = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [-30, 0],
    })

    return (
      <Animated.View
        style={[
          {
            opacity,
            transform: [{ translateX }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.optionItem}
          onPress={() => handleSelect(item)}
          activeOpacity={0.7}
        >
          {item.icon && <Text style={styles.optionIcon}>{item.icon}</Text>}
          <Text style={styles.optionLabel}>{item.label}</Text>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  return (
    <AnimatedModal
      visible={visible}
      onClose={onClose}
      title={title}
      animationType={animationType}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search */}
      {searchable && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* Options List */}
      <FlatList
        data={filteredOptions}
        renderItem={({ item, index }) => renderOption(item, index)}
        keyExtractor={(item) => item.id}
        scrollEnabled={filteredOptions.length > 5}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />
    </AnimatedModal>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  cancelButton: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  placeholder: {
    width: 60,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1a1a1a',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
})

