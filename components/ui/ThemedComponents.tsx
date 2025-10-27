import { APP_THEME } from '@/constants/AppTheme'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native'

// ============================================================================
// BUTTONS
// ============================================================================

interface ThemedButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'base' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: keyof typeof Ionicons.glyphMap
  style?: ViewStyle
}

export const ThemedButton: React.FC<ThemedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'base',
  disabled = false,
  loading = false,
  icon,
  style,
}) => {
  const getButtonStyle = () => {
    const baseStyle = {
      height: APP_THEME.components.button.height[size],
      paddingHorizontal: APP_THEME.components.button.paddingHorizontal[size],
      borderRadius: APP_THEME.components.button.borderRadius,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? APP_THEME.colors.textTertiary : APP_THEME.colors.primary,
        }
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: APP_THEME.colors.secondary,
        }
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: APP_THEME.colors.primary,
        }
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        }
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: APP_THEME.colors.error,
        }
      default:
        return baseStyle
    }
  }

  const getTextStyle = (): TextStyle => {
    const baseStyle = {
      fontSize: APP_THEME.typography.fontSize.base,
      fontWeight: APP_THEME.typography.fontWeight.semibold as any,
    }

    switch (variant) {
      case 'outline':
      case 'ghost':
        return {
          ...baseStyle,
          color: APP_THEME.colors.primary,
        }
      default:
        return {
          ...baseStyle,
          color: APP_THEME.colors.textInverse,
        }
    }
  }

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={APP_THEME.colors.textInverse} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={getTextStyle().color as string}
              style={{ marginRight: 8 }}
            />
          )}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  )
}

// ============================================================================
// INPUT FIELDS
// ============================================================================

interface ThemedInputProps {
  placeholder?: string
  value: string
  onChangeText: (text: string) => void
  icon?: keyof typeof Ionicons.glyphMap
  error?: string
  disabled?: boolean
  multiline?: boolean
  numberOfLines?: number
  style?: ViewStyle
}

export const ThemedInput: React.FC<ThemedInputProps> = ({
  placeholder,
  value,
  onChangeText,
  icon,
  error,
  disabled,
  multiline,
  numberOfLines,
  style,
}) => {
  return (
    <View style={style}>
      <View style={[
        styles.inputContainer,
        error && styles.inputError,
        disabled && styles.inputDisabled,
      ]}>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={APP_THEME.colors.textSecondary}
            style={styles.inputIcon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            icon && styles.inputWithIcon,
          ]}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          placeholderTextColor={APP_THEME.colors.textTertiary}
        />
      </View>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  )
}

// ============================================================================
// CARDS
// ============================================================================

interface ThemedCardProps {
  children: React.ReactNode
  onPress?: () => void
  style?: ViewStyle
}

export const ThemedCard: React.FC<ThemedCardProps> = ({
  children,
  onPress,
  style,
}) => {
  const Component = onPress ? TouchableOpacity : View

  return (
    <Component
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {children}
    </Component>
  )
}

// ============================================================================
// SETTING ITEM
// ============================================================================

interface ThemedSettingItemProps {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  subtitle?: string
  value?: boolean
  onToggle?: (value: boolean) => void
  onPress?: () => void
  destructive?: boolean
}

export const ThemedSettingItem: React.FC<ThemedSettingItemProps> = ({
  icon,
  title,
  subtitle,
  value,
  onToggle,
  onPress,
  destructive,
}) => {
  if (onToggle !== undefined) {
    return (
      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <View style={styles.settingIconContainer}>
            <Ionicons
              name={icon}
              size={20}
              color={APP_THEME.colors.textSecondary}
            />
          </View>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>{title}</Text>
            {subtitle && (
              <Text style={styles.settingSubtitle}>{subtitle}</Text>
            )}
          </View>
        </View>
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={APP_THEME.components.toggle.trackColor}
          thumbColor={APP_THEME.components.toggle.thumbColor}
        />
      </View>
    )
  }

  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIconContainer}>
          <Ionicons
            name={icon}
            size={20}
            color={destructive ? APP_THEME.colors.error : APP_THEME.colors.textSecondary}
          />
        </View>
        <View style={styles.settingText}>
          <Text style={[
            styles.settingTitle,
            destructive && { color: APP_THEME.colors.error },
          ]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={APP_THEME.colors.textTertiary}
      />
    </TouchableOpacity>
  )
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Input Styles
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: APP_THEME.components.input.height,
    paddingHorizontal: APP_THEME.components.input.paddingHorizontal,
    borderRadius: APP_THEME.components.input.borderRadius,
    borderWidth: APP_THEME.components.input.borderWidth,
    borderColor: APP_THEME.colors.border,
    backgroundColor: APP_THEME.colors.surface,
  },
  input: {
    flex: 1,
    fontSize: APP_THEME.typography.fontSize.base,
    color: APP_THEME.colors.textPrimary,
  },
  inputWithIcon: {
    marginLeft: APP_THEME.spacing.sm,
  },
  inputIcon: {
    marginRight: APP_THEME.spacing.sm,
  },
  inputError: {
    borderColor: APP_THEME.colors.error,
  },
  inputDisabled: {
    backgroundColor: APP_THEME.colors.borderLight,
    opacity: 0.5,
  },
  errorText: {
    fontSize: APP_THEME.typography.fontSize.sm,
    color: APP_THEME.colors.error,
    marginTop: APP_THEME.spacing.sm,
  },

  // Card Styles
  card: {
    backgroundColor: APP_THEME.colors.surface,
    borderRadius: APP_THEME.components.card.borderRadius,
    padding: APP_THEME.components.card.padding,
    ...APP_THEME.shadows.base,
  },

  // Setting Item Styles
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: APP_THEME.spacing.md,
    paddingHorizontal: APP_THEME.spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.borderLight,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: APP_THEME.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: APP_THEME.spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: APP_THEME.typography.fontSize.base,
    fontWeight: APP_THEME.typography.fontWeight.medium as any,
    color: APP_THEME.colors.textPrimary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: APP_THEME.typography.fontSize.sm,
    color: APP_THEME.colors.textSecondary,
  },
})

