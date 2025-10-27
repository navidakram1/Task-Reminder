# 🎨 Theme Quick Reference - Copy & Paste Guide

## 🎯 Most Used Values

### Colors
```typescript
// Primary Actions
backgroundColor: APP_THEME.colors.primary // #FF6B6B
color: APP_THEME.colors.primary

// Text
color: APP_THEME.colors.textPrimary // #1A1A1A
color: APP_THEME.colors.textSecondary // #6B7280
color: APP_THEME.colors.textTertiary // #9CA3AF

// Backgrounds
backgroundColor: APP_THEME.colors.background // #F8F9FA
backgroundColor: APP_THEME.colors.surface // #FFFFFF

// Borders
borderColor: APP_THEME.colors.border // #E5E7EB

// Status
color: APP_THEME.colors.success // #10B981
color: APP_THEME.colors.error // #EF4444
color: APP_THEME.colors.warning // #F59E0B
```

### Spacing
```typescript
// Standard Padding
padding: APP_THEME.spacing.base // 16px
paddingHorizontal: APP_THEME.spacing.base
paddingVertical: APP_THEME.spacing.base

// Margins
marginBottom: APP_THEME.spacing.lg // 20px
marginTop: APP_THEME.spacing.md // 12px
marginRight: APP_THEME.spacing.sm // 8px

// Gaps
gap: APP_THEME.spacing.md // 12px
```

### Typography
```typescript
// Headings
fontSize: APP_THEME.typography.fontSize.xl // 20px
fontWeight: APP_THEME.typography.fontWeight.bold // 700

// Body Text
fontSize: APP_THEME.typography.fontSize.base // 15px
fontWeight: APP_THEME.typography.fontWeight.normal // 400

// Secondary Text
fontSize: APP_THEME.typography.fontSize.sm // 13px
color: APP_THEME.colors.textSecondary
```

### Shadows
```typescript
// Cards
...APP_THEME.shadows.sm

// Buttons
...APP_THEME.shadows.md

// Modals
...APP_THEME.shadows.lg
```

### Border Radius
```typescript
// Cards
borderRadius: APP_THEME.borderRadius.lg // 16px

// Buttons
borderRadius: APP_THEME.borderRadius.md // 12px

// Avatars
borderRadius: APP_THEME.borderRadius.full // 9999px
```

## 📋 Common Patterns

### Container
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_THEME.colors.background,
    paddingHorizontal: APP_THEME.spacing.base,
    paddingVertical: APP_THEME.spacing.lg,
  },
})
```

### Card
```typescript
const styles = StyleSheet.create({
  card: {
    backgroundColor: APP_THEME.colors.surface,
    borderRadius: APP_THEME.borderRadius.lg,
    padding: APP_THEME.spacing.base,
    marginBottom: APP_THEME.spacing.md,
    ...APP_THEME.shadows.sm,
  },
})
```

### Button
```typescript
const styles = StyleSheet.create({
  button: {
    height: APP_THEME.components.button.height.base, // 44px
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

### Input
```typescript
const styles = StyleSheet.create({
  input: {
    height: APP_THEME.components.input.height, // 48px
    paddingHorizontal: APP_THEME.components.input.paddingHorizontal,
    borderRadius: APP_THEME.components.input.borderRadius,
    borderWidth: APP_THEME.components.input.borderWidth,
    borderColor: APP_THEME.colors.border,
    backgroundColor: APP_THEME.colors.surface,
    fontSize: APP_THEME.typography.fontSize.base,
    color: APP_THEME.colors.textPrimary,
  },
})
```

### List Item
```typescript
const styles = StyleSheet.create({
  listItem: {
    height: APP_THEME.components.listItem.height, // 64px
    paddingHorizontal: APP_THEME.components.listItem.paddingHorizontal,
    borderRadius: APP_THEME.components.listItem.borderRadius,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: APP_THEME.colors.borderLight,
  },
})
```

### Header
```typescript
const styles = StyleSheet.create({
  header: {
    paddingHorizontal: APP_THEME.spacing.base,
    paddingTop: APP_THEME.spacing.lg,
    paddingBottom: APP_THEME.spacing.base,
  },
  title: {
    fontSize: APP_THEME.typography.fontSize.xl,
    fontWeight: APP_THEME.typography.fontWeight.bold,
    color: APP_THEME.colors.textPrimary,
  },
  subtitle: {
    fontSize: APP_THEME.typography.fontSize.sm,
    color: APP_THEME.colors.textSecondary,
    marginTop: APP_THEME.spacing.sm,
  },
})
```

### Section
```typescript
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

## 🧩 Component Usage

### ThemedButton
```typescript
<ThemedButton 
  title="Save" 
  onPress={handleSave}
  variant="primary"
  size="base"
/>

<ThemedButton 
  title="Cancel" 
  onPress={handleCancel}
  variant="outline"
/>

<ThemedButton 
  title="Delete" 
  onPress={handleDelete}
  variant="danger"
/>
```

### ThemedInput
```typescript
<ThemedInput
  placeholder="Enter name"
  value={name}
  onChangeText={setName}
  icon="person-outline"
/>

<ThemedInput
  placeholder="Enter email"
  value={email}
  onChangeText={setEmail}
  icon="mail-outline"
  error={emailError}
/>
```

### ThemedCard
```typescript
<ThemedCard onPress={handlePress}>
  <Text>Card content</Text>
</ThemedCard>

<ThemedCard>
  <Text>Static card</Text>
</ThemedCard>
```

### ThemedSettingItem
```typescript
<ThemedSettingItem
  icon="bell-outline"
  title="Notifications"
  subtitle="Manage notifications"
  value={enabled}
  onToggle={setEnabled}
/>

<ThemedSettingItem
  icon="person-outline"
  title="Edit Profile"
  subtitle="Update your information"
  onPress={() => router.push('/profile/edit')}
/>
```

## 🎨 Color Combinations

### Primary Action
```typescript
backgroundColor: APP_THEME.colors.primary // #FF6B6B
color: APP_THEME.colors.textInverse // #FFFFFF
```

### Secondary Action
```typescript
backgroundColor: APP_THEME.colors.secondary // #4ECDC4
color: APP_THEME.colors.textInverse // #FFFFFF
```

### Outline Button
```typescript
backgroundColor: 'transparent'
borderWidth: 2
borderColor: APP_THEME.colors.primary // #FF6B6B
color: APP_THEME.colors.primary // #FF6B6B
```

### Disabled State
```typescript
backgroundColor: APP_THEME.colors.textTertiary // #9CA3AF
opacity: 0.5
```

### Error State
```typescript
borderColor: APP_THEME.colors.error // #EF4444
color: APP_THEME.colors.error // #EF4444
```

### Success State
```typescript
backgroundColor: APP_THEME.colors.success // #10B981
color: APP_THEME.colors.textInverse // #FFFFFF
```

## 📱 Responsive Patterns

### Mobile Container
```typescript
paddingHorizontal: APP_THEME.spacing.base // 16px
```

### Tablet Container
```typescript
paddingHorizontal: APP_THEME.spacing.xl // 24px
maxWidth: APP_THEME.layout.maxWidth // 600px
alignSelf: 'center'
```

### Grid Spacing
```typescript
gap: APP_THEME.spacing.md // 12px
```

## 🎬 Animation Values

### Fast Animation
```typescript
duration: APP_THEME.animations.duration.fast // 150ms
```

### Standard Animation
```typescript
duration: APP_THEME.animations.duration.base // 250ms
```

### Slow Animation
```typescript
duration: APP_THEME.animations.duration.slow // 350ms
```

## ✅ Checklist for New Pages

- [ ] Import `APP_THEME`
- [ ] Use `APP_THEME.colors.*` for all colors
- [ ] Use `APP_THEME.spacing.*` for all spacing
- [ ] Use `APP_THEME.typography.*` for all text
- [ ] Use `APP_THEME.shadows.*` for all shadows
- [ ] Use `APP_THEME.borderRadius.*` for all radius
- [ ] Use themed components where applicable
- [ ] Test on iOS, Android, Web
- [ ] Verify accessibility
- [ ] Check responsive design

## 🔗 Related Files

- **Theme**: `constants/AppTheme.ts`
- **Components**: `components/ui/ThemedComponents.tsx`
- **Design System**: `docs/DESIGN_SYSTEM.md`
- **Implementation Guide**: `docs/THEME_IMPLEMENTATION_GUIDE.md`
- **Example Page**: `app/(app)/settings/clean.tsx`

---

**Quick Reference Version**: 1.0.0  
**Last Updated**: 2025-10-27  
**Print This**: Yes, it's designed to be printed!

