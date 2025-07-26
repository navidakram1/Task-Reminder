import React from 'react'
import { Platform, StyleSheet, View, ViewStyle } from 'react-native'

interface SafeAreaContainerProps {
  children: React.ReactNode
  style?: ViewStyle
  includeBottomPadding?: boolean
}

export const SafeAreaContainer: React.FC<SafeAreaContainerProps> = ({
  children,
  style,
  includeBottomPadding = true,
}) => {
  return (
    <View
      style={[
        styles.container,
        includeBottomPadding && styles.bottomPadding,
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  bottomPadding: {
    paddingBottom: Platform.OS === 'ios' ? 85 : 65, // Account for bottom navigation
  },
})
