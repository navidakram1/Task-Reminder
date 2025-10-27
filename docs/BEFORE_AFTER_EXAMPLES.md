# 🔄 Before & After Examples - Theme Migration

## Example 1: Simple Container

### ❌ Before (Hardcoded)
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
})
```

### ✅ After (Themed)
```typescript
import { APP_THEME } from '@/constants/AppTheme'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
    paddingHorizontal: APP_THEME.spacing.base,
    paddingVertical: APP_THEME.spacing.lg,
  },
})
```

**Benefits**: Easy to change colors globally, consistent spacing, maintainable

---

## Example 2: Card Component

### ❌ Before (Hardcoded)
```typescript
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
})
```

### ✅ After (Themed)
```typescript
import { APP_THEME } from '@/constants/AppTheme'

const styles = StyleSheet.create({
  card: {
    backgroundColor: APP_THEME.colors.surface,
    borderRadius: APP_THEME.borderRadius.lg,
    padding: APP_THEME.spacing.base,
    marginBottom: APP_THEME.spacing.md,
    ...APP_THEME.shadows.base,
  },
})
```

**Benefits**: Cleaner code, consistent shadows, easier to maintain

---

## Example 3: Button

### ❌ Before (Hardcoded)
```typescript
const styles = StyleSheet.create({
  button: {
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
```

### ✅ After (Themed)
```typescript
import { APP_THEME } from '@/constants/AppTheme'

const styles = StyleSheet.create({
  button: {
    height: APP_THEME.components.button.height.base,
    paddingHorizontal: APP_THEME.components.button.paddingHorizontal.base,
    borderRadius: APP_THEME.components.button.borderRadius,
    backgroundColor: APP_THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: APP_THEME.typography.fontSize.base,
    fontWeight: APP_THEME.typography.fontWeight.semibold,
    color: APP_THEME.colors.textInverse,
  },
})
```

### ✅ Best (Using Component)
```typescript
import { ThemedButton } from '@/components/ui/ThemedComponents'

<ThemedButton 
  title="Save" 
  onPress={handleSave}
  variant="primary"
  size="base"
/>
```

**Benefits**: Reusable, consistent, less code, easier to maintain

---

## Example 4: Input Field

### ❌ Before (Hardcoded)
```typescript
const styles = StyleSheet.create({
  inputContainer: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
  },
})
```

### ✅ After (Themed)
```typescript
import { APP_THEME } from '@/constants/AppTheme'

const styles = StyleSheet.create({
  inputContainer: {
    height: APP_THEME.components.input.height,
    paddingHorizontal: APP_THEME.components.input.paddingHorizontal,
    borderRadius: APP_THEME.components.input.borderRadius,
    borderWidth: APP_THEME.components.input.borderWidth,
    borderColor: APP_THEME.colors.border,
    backgroundColor: APP_THEME.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: APP_THEME.typography.fontSize.base,
    color: APP_THEME.colors.textPrimary,
  },
})
```

### ✅ Best (Using Component)
```typescript
import { ThemedInput } from '@/components/ui/ThemedComponents'

<ThemedInput
  placeholder="Enter name"
  value={name}
  onChangeText={setName}
  icon="person-outline"
/>
```

**Benefits**: Reusable, consistent, error handling built-in

---

## Example 5: Text Hierarchy

### ❌ Before (Hardcoded)
```typescript
const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 8,
  },
  description: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
    marginTop: 4,
  },
})
```

### ✅ After (Themed)
```typescript
import { APP_THEME } from '@/constants/AppTheme'

const styles = StyleSheet.create({
  title: {
    fontSize: APP_THEME.typography.fontSize.xl,
    fontWeight: APP_THEME.typography.fontWeight.bold,
    color: APP_THEME.colors.textPrimary,
  },
  subtitle: {
    fontSize: APP_THEME.typography.fontSize.md,
    fontWeight: APP_THEME.typography.fontWeight.medium,
    color: APP_THEME.colors.textSecondary,
    marginTop: APP_THEME.spacing.sm,
  },
  description: {
    fontSize: APP_THEME.typography.fontSize.sm,
    fontWeight: APP_THEME.typography.fontWeight.normal,
    color: APP_THEME.colors.textTertiary,
    marginTop: APP_THEME.spacing.xs,
  },
})
```

**Benefits**: Consistent typography hierarchy, easy to adjust globally

---

## Example 6: List Item

### ❌ Before (Hardcoded)
```typescript
const styles = StyleSheet.create({
  listItem: {
    height: 64,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
})
```

### ✅ After (Themed)
```typescript
import { APP_THEME } from '@/constants/AppTheme'

const styles = StyleSheet.create({
  listItem: {
    height: APP_THEME.components.listItem.height,
    paddingHorizontal: APP_THEME.components.listItem.paddingHorizontal,
    borderRadius: APP_THEME.components.listItem.borderRadius,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.borderLight,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: APP_THEME.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: APP_THEME.spacing.md,
  },
  title: {
    fontSize: APP_THEME.typography.fontSize.base,
    fontWeight: APP_THEME.typography.fontWeight.medium,
    color: APP_THEME.colors.textPrimary,
  },
  subtitle: {
    fontSize: APP_THEME.typography.fontSize.sm,
    color: APP_THEME.colors.textSecondary,
    marginTop: 2,
  },
})
```

### ✅ Best (Using Component)
```typescript
import { ThemedSettingItem } from '@/components/ui/ThemedComponents'

<ThemedSettingItem
  icon="bell-outline"
  title="Notifications"
  subtitle="Manage notifications"
  value={enabled}
  onToggle={setEnabled}
/>
```

**Benefits**: Reusable, consistent, less code

---

## Example 7: Section with Multiple Items

### ❌ Before (Hardcoded)
```typescript
const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
})
```

### ✅ After (Themed)
```typescript
import { APP_THEME } from '@/constants/AppTheme'

const styles = StyleSheet.create({
  section: {
    marginBottom: APP_THEME.spacing.lg,
  },
  sectionTitle: {
    fontSize: APP_THEME.typography.fontSize.lg,
    fontWeight: APP_THEME.typography.fontWeight.semibold,
    color: APP_THEME.colors.textPrimary,
    marginBottom: APP_THEME.spacing.md,
    marginHorizontal: APP_THEME.spacing.base,
  },
  sectionContent: {
    backgroundColor: APP_THEME.colors.surface,
    borderRadius: APP_THEME.borderRadius.lg,
    marginHorizontal: APP_THEME.spacing.base,
    ...APP_THEME.shadows.sm,
  },
})
```

**Benefits**: Consistent spacing, easier to maintain, cleaner code

---

## Example 8: Status Colors

### ❌ Before (Hardcoded)
```typescript
const getStatusColor = (status: string) => {
  switch (status) {
    case 'success':
      return '#10B981'
    case 'error':
      return '#EF4444'
    case 'warning':
      return '#F59E0B'
    case 'info':
      return '#3B82F6'
    default:
      return '#6B7280'
  }
}
```

### ✅ After (Themed)
```typescript
import { APP_THEME } from '@/constants/AppTheme'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'success':
      return APP_THEME.colors.success
    case 'error':
      return APP_THEME.colors.error
    case 'warning':
      return APP_THEME.colors.warning
    case 'info':
      return APP_THEME.colors.info
    default:
      return APP_THEME.colors.textSecondary
  }
}
```

**Benefits**: Centralized colors, easy to change globally

---

## Summary of Changes

| Aspect | Before | After | Benefit |
|--------|--------|-------|---------|
| Colors | Hardcoded hex | `APP_THEME.colors.*` | Global changes easy |
| Spacing | Hardcoded pixels | `APP_THEME.spacing.*` | Consistent spacing |
| Typography | Hardcoded values | `APP_THEME.typography.*` | Consistent text |
| Shadows | Hardcoded values | `APP_THEME.shadows.*` | Professional look |
| Components | Custom code | `ThemedButton`, etc. | Reusable, less code |
| Maintenance | Difficult | Easy | Update once, apply everywhere |
| Consistency | Manual | Automatic | Always consistent |

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-27  
**Use This**: As a reference when migrating pages

