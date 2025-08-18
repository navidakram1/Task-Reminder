# 🎨 SplitDuty Design System & UI/UX Polish Guide

## Overview

This guide outlines the comprehensive design system for SplitDuty, ensuring consistent, beautiful, and accessible user interfaces across all screens.

## 🎨 Design System

### Color Palette

```typescript
export const BRAND_COLORS = {
  // Primary Colors
  PRIMARY: '#667eea',           // Main brand color
  PRIMARY_LIGHT: '#818cf8',     // Lighter variant
  PRIMARY_DARK: '#4f46e5',      // Darker variant
  
  // Secondary Colors
  SECONDARY: '#06b6d4',         // Cyan for accents
  SECONDARY_LIGHT: '#22d3ee',   // Light cyan
  SECONDARY_DARK: '#0891b2',    // Dark cyan
  
  // Accent Colors
  ACCENT: '#f59e0b',            // Amber for highlights
  ACCENT_LIGHT: '#fbbf24',      // Light amber
  ACCENT_DARK: '#d97706',       // Dark amber
  
  // Status Colors
  SUCCESS: '#10b981',           // Green for success
  WARNING: '#f59e0b',           // Amber for warnings
  ERROR: '#ef4444',             // Red for errors
  INFO: '#3b82f6',              // Blue for info
  
  // Neutral Colors
  WHITE: '#ffffff',
  BLACK: '#000000',
  GRAY_50: '#f9fafb',
  GRAY_100: '#f3f4f6',
  GRAY_200: '#e5e7eb',
  GRAY_300: '#d1d5db',
  GRAY_400: '#9ca3af',
  GRAY_500: '#6b7280',
  GRAY_600: '#4b5563',
  GRAY_700: '#374151',
  GRAY_800: '#1f2937',
  GRAY_900: '#111827',
  
  // Background Colors
  BACKGROUND: '#f8f9fa',
  SURFACE: '#ffffff',
  OVERLAY: 'rgba(0, 0, 0, 0.5)',
}
```

### Typography

```typescript
export const TYPOGRAPHY = {
  // Font Families
  FONT_FAMILY: {
    REGULAR: 'System',
    MEDIUM: 'System',
    BOLD: 'System',
  },
  
  // Font Sizes
  FONT_SIZE: {
    XS: 12,
    SM: 14,
    BASE: 16,
    LG: 18,
    XL: 20,
    XXL: 24,
    XXXL: 28,
    TITLE: 32,
  },
  
  // Line Heights
  LINE_HEIGHT: {
    TIGHT: 1.2,
    NORMAL: 1.5,
    RELAXED: 1.75,
  },
  
  // Font Weights
  FONT_WEIGHT: {
    NORMAL: '400',
    MEDIUM: '500',
    SEMIBOLD: '600',
    BOLD: '700',
  },
}
```

### Spacing

```typescript
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  XXL: 24,
  XXXL: 32,
  HUGE: 40,
  MASSIVE: 48,
}
```

### Border Radius

```typescript
export const BORDER_RADIUS = {
  SM: 4,
  MD: 8,
  LG: 12,
  XL: 16,
  XXL: 20,
  ROUND: 50,
}
```

### Shadows

```typescript
export const SHADOWS = {
  SM: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  MD: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  LG: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  XL: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
}
```

## 🧩 Component Library

### Button Components

```typescript
// Primary Button
export const PrimaryButton = ({ title, onPress, disabled, loading, ...props }) => (
  <TouchableOpacity
    style={[
      styles.primaryButton,
      disabled && styles.disabledButton,
      props.style
    ]}
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.8}
  >
    {loading ? (
      <ActivityIndicator color={BRAND_COLORS.WHITE} />
    ) : (
      <Text style={styles.primaryButtonText}>{title}</Text>
    )}
  </TouchableOpacity>
)

// Secondary Button
export const SecondaryButton = ({ title, onPress, disabled, ...props }) => (
  <TouchableOpacity
    style={[
      styles.secondaryButton,
      disabled && styles.disabledSecondaryButton,
      props.style
    ]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.8}
  >
    <Text style={styles.secondaryButtonText}>{title}</Text>
  </TouchableOpacity>
)
```

### Card Components

```typescript
export const Card = ({ children, style, ...props }) => (
  <View style={[styles.card, style]} {...props}>
    {children}
  </View>
)

export const TaskCard = ({ task, onPress }) => (
  <TouchableOpacity style={styles.taskCard} onPress={onPress}>
    <View style={styles.taskHeader}>
      {task.emoji && <Text style={styles.taskEmoji}>{task.emoji}</Text>}
      <Text style={styles.taskTitle}>{task.title}</Text>
      <StatusBadge status={task.status} />
    </View>
    {task.description && (
      <Text style={styles.taskDescription}>{task.description}</Text>
    )}
    <View style={styles.taskFooter}>
      {task.due_date && (
        <Text style={styles.taskDueDate}>
          📅 {formatDate(task.due_date)}
        </Text>
      )}
      {task.assignee && (
        <Text style={styles.taskAssignee}>
          👤 {task.assignee}
        </Text>
      )}
    </View>
  </TouchableOpacity>
)
```

### Input Components

```typescript
export const TextInput = ({ label, error, ...props }) => (
  <View style={styles.inputContainer}>
    {label && <Text style={styles.inputLabel}>{label}</Text>}
    <RNTextInput
      style={[
        styles.textInput,
        error && styles.textInputError,
        props.style
      ]}
      placeholderTextColor={BRAND_COLORS.GRAY_400}
      {...props}
    />
    {error && <Text style={styles.inputError}>{error}</Text>}
  </View>
)

export const SearchInput = ({ value, onChangeText, placeholder, ...props }) => (
  <View style={styles.searchContainer}>
    <Text style={styles.searchIcon}>🔍</Text>
    <RNTextInput
      style={styles.searchInput}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={BRAND_COLORS.GRAY_400}
      {...props}
    />
    {value && (
      <TouchableOpacity onPress={() => onChangeText('')}>
        <Text style={styles.clearIcon}>✕</Text>
      </TouchableOpacity>
    )}
  </View>
)
```

## 🎭 Animations

### Fade In Animation

```typescript
export const useFadeIn = (duration = 300) => {
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start()
  }, [])

  return fadeAnim
}
```

### Slide In Animation

```typescript
export const useSlideIn = (direction = 'up', duration = 300) => {
  const slideAnim = useRef(new Animated.Value(50)).current

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration,
      useNativeDriver: true,
    }).start()
  }, [])

  return slideAnim
}
```

### Scale Animation

```typescript
export const useScaleIn = (duration = 200) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start()
  }, [])

  return scaleAnim
}
```

## 📱 Screen Layouts

### Standard Screen Layout

```typescript
export const ScreenLayout = ({ children, title, showBack = true }) => {
  const fadeAnim = useFadeIn()

  return (
    <Animated.View style={[styles.screenContainer, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.screenTitle}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.content}>
        {children}
      </ScrollView>
    </Animated.View>
  )
}
```

### Loading States

```typescript
export const LoadingScreen = ({ message = 'Loading...' }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={BRAND_COLORS.PRIMARY} />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
)

export const LoadingCard = () => (
  <View style={styles.loadingCard}>
    <View style={styles.loadingLine} />
    <View style={styles.loadingLineShort} />
    <View style={styles.loadingLine} />
  </View>
)
```

### Empty States

```typescript
export const EmptyState = ({ 
  icon, 
  title, 
  description, 
  actionText, 
  onAction 
}) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyStateIcon}>{icon}</Text>
    <Text style={styles.emptyStateTitle}>{title}</Text>
    <Text style={styles.emptyStateDescription}>{description}</Text>
    {actionText && onAction && (
      <TouchableOpacity style={styles.emptyStateButton} onPress={onAction}>
        <Text style={styles.emptyStateButtonText}>{actionText}</Text>
      </TouchableOpacity>
    )}
  </View>
)
```

## 🎯 Accessibility

### Screen Reader Support

```typescript
// Add accessibility labels
<TouchableOpacity
  accessibilityLabel="Create new task"
  accessibilityHint="Opens the task creation form"
  accessibilityRole="button"
>
  <Text>+ Add Task</Text>
</TouchableOpacity>

// Group related elements
<View accessibilityRole="group" accessibilityLabel="Task details">
  <Text>{task.title}</Text>
  <Text>{task.description}</Text>
</View>
```

### Color Contrast

- Ensure minimum 4.5:1 contrast ratio for normal text
- Ensure minimum 3:1 contrast ratio for large text
- Use semantic colors for status indicators

### Touch Targets

- Minimum 44x44 points for touch targets
- Adequate spacing between interactive elements
- Clear visual feedback for interactions

## 🎨 Polish Checklist

### Visual Polish
- [ ] Consistent spacing throughout the app
- [ ] Proper typography hierarchy
- [ ] Consistent color usage
- [ ] Smooth animations and transitions
- [ ] Loading states for all async operations
- [ ] Empty states for all lists
- [ ] Error states with helpful messages
- [ ] Consistent iconography

### Interaction Polish
- [ ] Haptic feedback for important actions
- [ ] Visual feedback for all interactions
- [ ] Smooth scrolling and gestures
- [ ] Proper keyboard handling
- [ ] Pull-to-refresh where appropriate
- [ ] Swipe gestures where useful

### Performance Polish
- [ ] Optimized images and assets
- [ ] Lazy loading for lists
- [ ] Efficient re-renders
- [ ] Smooth 60fps animations
- [ ] Fast app startup time
- [ ] Minimal memory usage

### Accessibility Polish
- [ ] Screen reader compatibility
- [ ] Proper focus management
- [ ] Keyboard navigation support
- [ ] High contrast mode support
- [ ] Dynamic type support
- [ ] Voice control compatibility

## 🚀 Implementation Priority

1. **High Priority**
   - Consistent spacing and typography
   - Loading and empty states
   - Basic animations (fade in/out)
   - Error handling and feedback

2. **Medium Priority**
   - Advanced animations
   - Haptic feedback
   - Accessibility improvements
   - Performance optimizations

3. **Low Priority**
   - Micro-interactions
   - Advanced gestures
   - Theme customization
   - Advanced accessibility features

The design system ensures a cohesive, professional, and delightful user experience! 🎨✨
