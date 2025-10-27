# Theme Implementation Guide - SplitDuty

## 📋 Overview

This guide explains how to apply the new clean modern theme to all pages in the SplitDuty app.

## 🎯 What's New

### New Files Created
1. **`constants/AppTheme.ts`** - Complete theme system with colors, typography, spacing, shadows
2. **`app/(app)/settings/clean.tsx`** - Modern settings page implementation
3. **`components/ui/ThemedComponents.tsx`** - Reusable themed components
4. **`docs/DESIGN_SYSTEM.md`** - Complete design system documentation

### Key Features
- ✅ Unified color palette
- ✅ Consistent typography system
- ✅ Standardized spacing (8px base unit)
- ✅ Professional shadows
- ✅ Reusable components
- ✅ Easy customization

## 🚀 Quick Start

### 1. Import the Theme
```typescript
import { APP_THEME } from '@/constants/AppTheme'
```

### 2. Use Theme Values
```typescript
// Colors
backgroundColor: APP_THEME.colors.background
color: APP_THEME.colors.textPrimary

// Spacing
padding: APP_THEME.spacing.base
marginBottom: APP_THEME.spacing.lg

// Typography
fontSize: APP_THEME.typography.fontSize.base
fontWeight: APP_THEME.typography.fontWeight.semibold

// Shadows
...APP_THEME.shadows.md

// Border Radius
borderRadius: APP_THEME.borderRadius.lg
```

### 3. Use Themed Components
```typescript
import { 
  ThemedButton, 
  ThemedInput, 
  ThemedCard,
  ThemedSettingItem 
} from '@/components/ui/ThemedComponents'

// Button
<ThemedButton 
  title="Save" 
  onPress={handleSave}
  variant="primary"
  size="base"
/>

// Input
<ThemedInput
  placeholder="Enter name"
  value={name}
  onChangeText={setName}
  icon="person-outline"
/>

// Card
<ThemedCard onPress={handlePress}>
  <Text>Card content</Text>
</ThemedCard>

// Setting Item
<ThemedSettingItem
  icon="bell-outline"
  title="Notifications"
  subtitle="Manage notifications"
  value={enabled}
  onToggle={setEnabled}
/>
```

## 📱 Applying Theme to Pages

### Step 1: Dashboard Page
**File**: `app/(app)/dashboard/index.tsx`

```typescript
// 1. Import theme
import { APP_THEME } from '@/constants/AppTheme'

// 2. Replace colors
// Before: backgroundColor: '#F8F9FA'
// After:
backgroundColor: APP_THEME.colors.background

// 3. Replace spacing
// Before: padding: 16
// After:
padding: APP_THEME.spacing.base

// 4. Replace typography
// Before: fontSize: 16, fontWeight: '600'
// After:
fontSize: APP_THEME.typography.fontSize.base
fontWeight: APP_THEME.typography.fontWeight.semibold

// 5. Replace shadows
// Before: shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, ...
// After:
...APP_THEME.shadows.md
```

### Step 2: Tasks Page
**File**: `app/(app)/tasks/index.tsx`

Apply same pattern as Dashboard:
1. Import theme
2. Replace all hardcoded colors
3. Replace all hardcoded spacing
4. Replace all hardcoded typography
5. Replace all hardcoded shadows

### Step 3: Bills Page
**File**: `app/(app)/bills/index.tsx`

Same pattern as above.

### Step 4: Approvals Page
**File**: `app/(app)/approvals/index.tsx`

Same pattern as above.

### Step 5: Proposals Page
**File**: `app/(app)/proposals/index.tsx`

Same pattern as above.

## 🎨 Color Usage Guide

### When to Use Each Color

**Primary Color** (`#FF6B6B`)
- Main action buttons
- Active states
- Important highlights
- Primary CTAs

**Secondary Color** (`#4ECDC4`)
- Success states
- Positive actions
- Alternative highlights

**Text Primary** (`#1A1A1A`)
- Main body text
- Headings
- Important information

**Text Secondary** (`#6B7280`)
- Secondary information
- Descriptions
- Subtitles

**Text Tertiary** (`#9CA3AF`)
- Hints
- Labels
- Disabled text

**Background** (`#F8F9FA`)
- Page background
- Container background

**Surface** (`#FFFFFF`)
- Cards
- Modals
- Containers

**Border** (`#E5E7EB`)
- Dividers
- Input borders
- Subtle separators

**Error** (`#EF4444`)
- Error messages
- Destructive actions
- Warnings

## 📐 Spacing Usage Guide

### Common Spacing Patterns

**Container Padding**
```typescript
paddingHorizontal: APP_THEME.spacing.base // 16px
paddingVertical: APP_THEME.spacing.base // 16px
```

**Section Spacing**
```typescript
marginBottom: APP_THEME.spacing.lg // 20px
```

**Item Spacing**
```typescript
marginBottom: APP_THEME.spacing.md // 12px
```

**Icon Spacing**
```typescript
marginRight: APP_THEME.spacing.sm // 8px
```

## 🔤 Typography Usage Guide

### Heading Hierarchy

**Page Title**
```typescript
fontSize: APP_THEME.typography.fontSize.xl // 20px
fontWeight: APP_THEME.typography.fontWeight.bold // 700
```

**Section Title**
```typescript
fontSize: APP_THEME.typography.fontSize.lg // 18px
fontWeight: APP_THEME.typography.fontWeight.semibold // 600
```

**Body Text**
```typescript
fontSize: APP_THEME.typography.fontSize.base // 15px
fontWeight: APP_THEME.typography.fontWeight.normal // 400
```

**Small Text**
```typescript
fontSize: APP_THEME.typography.fontSize.sm // 13px
fontWeight: APP_THEME.typography.fontWeight.normal // 400
```

## 🌑 Shadow Usage Guide

**Subtle Shadow** (Cards, List Items)
```typescript
...APP_THEME.shadows.sm
```

**Standard Shadow** (Modals, Overlays)
```typescript
...APP_THEME.shadows.base
```

**Medium Shadow** (Floating Buttons)
```typescript
...APP_THEME.shadows.md
```

**Large Shadow** (Prominent Elements)
```typescript
...APP_THEME.shadows.lg
```

## ✅ Implementation Checklist

For each page you update:

- [ ] Import `APP_THEME`
- [ ] Replace all hardcoded colors with theme values
- [ ] Replace all hardcoded spacing with theme values
- [ ] Replace all hardcoded typography with theme values
- [ ] Replace all hardcoded shadows with theme values
- [ ] Replace all hardcoded border radius with theme values
- [ ] Use themed components where applicable
- [ ] Test on iOS
- [ ] Test on Android
- [ ] Test on Web
- [ ] Verify accessibility (contrast, text size)
- [ ] Check responsive design

## 🔄 Migration Path

### Phase 1: Core Pages (This Week)
- [ ] Settings page (✅ Done - `clean.tsx`)
- [ ] Dashboard page
- [ ] Tasks page

### Phase 2: Secondary Pages (Next Week)
- [ ] Bills page
- [ ] Approvals page
- [ ] Proposals page

### Phase 3: Onboarding (Following Week)
- [ ] Login page
- [ ] Sign up page
- [ ] Profile setup page
- [ ] Household creation page

### Phase 4: Polish (Final Week)
- [ ] Add dark mode support
- [ ] Add accessibility features
- [ ] Create component library documentation
- [ ] Performance optimization

## 🎯 Testing Checklist

After applying theme to each page:

1. **Visual Testing**
   - [ ] Colors match design
   - [ ] Spacing is consistent
   - [ ] Typography is correct
   - [ ] Shadows are appropriate

2. **Responsive Testing**
   - [ ] Works on small phones (iPhone SE)
   - [ ] Works on large phones (iPhone 14 Pro Max)
   - [ ] Works on tablets
   - [ ] Works on web

3. **Accessibility Testing**
   - [ ] Text contrast is sufficient (WCAG AA)
   - [ ] Text is readable at 200% zoom
   - [ ] Touch targets are at least 44x44px
   - [ ] Colors are not the only indicator

4. **Performance Testing**
   - [ ] Page loads quickly
   - [ ] Animations are smooth (60fps)
   - [ ] No memory leaks
   - [ ] No unnecessary re-renders

## 🆘 Troubleshooting

### Colors Look Different
- Check if you're using the correct theme value
- Verify the color hex code in `AppTheme.ts`
- Test on actual device (simulator colors may differ)

### Spacing Looks Off
- Verify you're using the correct spacing value
- Check if parent container has padding
- Test on different screen sizes

### Text is Hard to Read
- Check text color contrast
- Verify font size is appropriate
- Check line height is sufficient

### Shadows Not Showing
- Verify shadow values are correct
- Check if parent has `overflow: 'hidden'`
- Test on actual device (shadows may not show in simulator)

## 📚 Resources

- **Design System**: `docs/DESIGN_SYSTEM.md`
- **Theme Constants**: `constants/AppTheme.ts`
- **Themed Components**: `components/ui/ThemedComponents.tsx`
- **Example Page**: `app/(app)/settings/clean.tsx`

## 🚀 Next Steps

1. Review the design system documentation
2. Study the clean settings page implementation
3. Start applying theme to Dashboard page
4. Test thoroughly on all platforms
5. Iterate based on feedback

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-27  
**Status**: Ready for Implementation

