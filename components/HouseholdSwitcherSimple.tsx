import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'

interface HouseholdSwitcherProps {
  currentHousehold?: any
  onHouseholdChange?: (household: any) => void
}

export default function HouseholdSwitcher({ currentHousehold, onHouseholdChange }: HouseholdSwitcherProps) {
  // Simplified version for debugging
  if (!currentHousehold) {
    return null
  }

  return (
    <TouchableOpacity style={styles.switcherButton}>
      <View style={styles.switcherContent}>
        <Text style={styles.switcherText}>
          {currentHousehold?.name || 'Select Household'}
        </Text>
        <Text style={styles.switcherHint}>
          Tap to switch households
        </Text>
      </View>
      <Text style={styles.switcherArrow}>⌄</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  switcherButton: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 20,
    // Web-compatible shadow
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  switcherContent: {
    flex: 1,
  },
  switcherText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  switcherHint: {
    fontSize: 12,
    color: '#666',
  },
  switcherArrow: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
})
