# SplitDuty Design System - Clean Modern Theme

## 🎨 Overview

The SplitDuty app uses a clean, modern design system inspired by premium financial apps like Splitwise. The design emphasizes clarity, simplicity, and delightful micro-interactions.

## 🎯 Design Principles

1. **Minimalist**: Remove unnecessary elements, focus on content
2. **Accessible**: Clear hierarchy, readable text, sufficient contrast
3. **Consistent**: Unified spacing, colors, and components
4. **Delightful**: Smooth animations, haptic feedback, micro-interactions
5. **Responsive**: Works seamlessly on all screen sizes

## 🌈 Color Palette

### Primary Colors
- **Primary**: `#FF6B6B` (Coral/Salmon) - Main actions, highlights
- **Primary Light**: `#FF8787` - Hover states
- **Primary Dark**: `#E85555` - Active states

### Secondary Colors
- **Secondary**: `#4ECDC4` (Turquoise) - Accents, success states
- **Secondary Light**: `#6FD9D1` - Hover states
- **Secondary Dark**: `#3BB8AF` - Active states

### Neutral Colors
- **Background**: `#F8F9FA` - Page background
- **Surface**: `#FFFFFF` - Cards, containers
- **Surface Hover**: `#F5F5F5` - Hover state
- **Border**: `#E5E7EB` - Dividers, borders
- **Border Light**: `#F3F4F6` - Subtle borders

### Text Colors
- **Text Primary**: `#1A1A1A` - Main text
- **Text Secondary**: `#6B7280` - Secondary text
- **Text Tertiary**: `#9CA3AF` - Hints, labels
- **Text Inverse**: `#FFFFFF` - Text on dark backgrounds

### Status Colors
- **Success**: `#10B981` (Green) - Positive actions
- **Warning**: `#F59E0B` (Orange) - Warnings
- **Error**: `#EF4444` (Red) - Errors, destructive actions
- **Info**: `#3B82F6` (Blue) - Information

### Accent Colors
- **Accent 1**: `#8B5CF6` (Purple) - Alternative highlight
- **Accent 2**: `#EC4899` (Pink) - Alternative highlight
- **Accent 3**: `#F59E0B` (Amber) - Alternative highlight
- **Accent 4**: `#06B6D4` (Cyan) - Alternative highlight

## 📝 Typography

### Font Families
- **iOS**: System font (San Francisco)
- **Android**: Roboto
- **Web**: System font stack

### Font Sizes
- **XS**: 11px - Small labels, hints
- **SM**: 13px - Secondary text
- **Base**: 15px - Body text
- **MD**: 16px - Larger body text
- **LG**: 18px - Section headers
- **XL**: 20px - Page titles
- **2XL**: 24px - Large titles
- **3XL**: 28px - Extra large titles
- **4XL**: 32px - Hero titles
- **5XL**: 40px - Maximum titles

### Font Weights
- **Normal**: 400 - Regular text
- **Medium**: 500 - Slightly emphasized
- **Semibold**: 600 - Emphasized text
- **Bold**: 700 - Strong emphasis

### Line Heights
- **Tight**: 1.2 - Compact text
- **Normal**: 1.5 - Standard text
- **Relaxed**: 1.75 - Spacious text

## 📏 Spacing System

All spacing uses an 8px base unit:
- **XS**: 4px
- **SM**: 8px
- **MD**: 12px
- **Base**: 16px
- **LG**: 20px
- **XL**: 24px
- **2XL**: 32px
- **3XL**: 40px
- **4XL**: 48px
- **5XL**: 64px

## 🔲 Border Radius

- **None**: 0px
- **SM**: 4px - Subtle rounding
- **Base**: 8px - Standard rounding
- **MD**: 12px - Medium rounding
- **LG**: 16px - Large rounding
- **XL**: 20px - Extra large rounding
- **2XL**: 24px - Maximum rounding
- **3XL**: 28px - Extra maximum rounding
- **Full**: 9999px - Circular

## 🌑 Shadows

### Shadow Levels
- **None**: No shadow
- **SM**: Subtle shadow (elevation 2)
- **Base**: Standard shadow (elevation 3)
- **MD**: Medium shadow (elevation 5)
- **LG**: Large shadow (elevation 8)
- **XL**: Extra large shadow (elevation 12)

## 🧩 Component Specifications

### Buttons
- **Height**: 44px (base), 36px (small), 52px (large)
- **Padding**: 24px horizontal (base)
- **Border Radius**: 12px
- **Font Size**: 16px (base)
- **Font Weight**: Semibold (600)

### Input Fields
- **Height**: 48px
- **Padding**: 16px horizontal
- **Border Radius**: 12px
- **Border Width**: 1px
- **Border Color**: `#E5E7EB`

### Cards
- **Border Radius**: 16px
- **Padding**: 16px
- **Background**: White
- **Shadow**: SM level

### List Items
- **Height**: 64px
- **Padding**: 16px horizontal
- **Border Radius**: 12px
- **Divider**: 1px `#F3F4F6`

### Avatars
- **Sizes**: 32px, 48px, 64px, 80px
- **Border Radius**: Full (circular)
- **Border**: Optional 2px white border

### Badges
- **Height**: 24px
- **Padding**: 12px horizontal
- **Border Radius**: 12px
- **Font Size**: 12px
- **Font Weight**: Medium (500)

### Toggle/Switch
- **Track Color Off**: `#E5E7EB`
- **Track Color On**: `#FF6B6B`
- **Thumb Color**: White
- **Height**: 31px (iOS), 28px (Android)

## 🎬 Animations

### Durations
- **Fast**: 150ms - Quick feedback
- **Base**: 250ms - Standard animation
- **Slow**: 350ms - Deliberate animation

### Common Animations
- **Press**: Scale 0.95, opacity 0.7 (150ms)
- **Hover**: Scale 1.02, opacity 0.8 (200ms)
- **Fade In**: Opacity 0 → 1 (300ms)
- **Slide Up**: TranslateY 20px → 0 (300ms)
- **Spring**: Friction 8, tension 40

## 📱 Layout

### Container Padding
- **Horizontal**: 16px
- **Vertical**: 16px (top/bottom sections)

### Section Spacing
- **Between Sections**: 24px
- **Between Items**: 12px

### Max Width
- **Desktop**: 600px (centered)
- **Mobile**: Full width with padding

## 🎨 Usage Examples

### Settings Page
```typescript
// Use the clean settings page
import CleanSettingsScreen from '@/app/(app)/settings/clean'

// Or import the theme
import { APP_THEME } from '@/constants/AppTheme'

// Apply colors
backgroundColor: APP_THEME.colors.background
color: APP_THEME.colors.textPrimary

// Apply spacing
padding: APP_THEME.spacing.base
marginBottom: APP_THEME.spacing.lg

// Apply shadows
...APP_THEME.shadows.md

// Apply border radius
borderRadius: APP_THEME.borderRadius.lg
```

### Creating New Pages
1. Import `APP_THEME` from `@/constants/AppTheme`
2. Use theme values for all styling
3. Follow spacing and typography guidelines
4. Use consistent component patterns
5. Add smooth animations

## 🔄 Applying Theme to All Pages

To apply this theme to all pages:

1. **Import the theme** in each page:
   ```typescript
   import { APP_THEME } from '@/constants/AppTheme'
   ```

2. **Replace hardcoded colors** with theme values:
   ```typescript
   // Before
   backgroundColor: '#FFFFFF'
   
   // After
   backgroundColor: APP_THEME.colors.surface
   ```

3. **Use consistent spacing**:
   ```typescript
   padding: APP_THEME.spacing.base
   marginBottom: APP_THEME.spacing.lg
   ```

4. **Apply shadows consistently**:
   ```typescript
   ...APP_THEME.shadows.md
   ```

5. **Use typography system**:
   ```typescript
   fontSize: APP_THEME.typography.fontSize.base
   fontWeight: APP_THEME.typography.fontWeight.semibold
   ```

## 📋 Checklist for New Pages

- [ ] Import `APP_THEME`
- [ ] Use theme colors (no hardcoded colors)
- [ ] Use theme spacing (no hardcoded margins/padding)
- [ ] Use theme typography (consistent font sizes/weights)
- [ ] Apply appropriate shadows
- [ ] Use consistent border radius
- [ ] Add smooth animations
- [ ] Test on iOS, Android, and Web
- [ ] Verify accessibility (contrast, text size)
- [ ] Check responsive design

## 🚀 Next Steps

1. Apply theme to Dashboard page
2. Apply theme to Tasks page
3. Apply theme to Bills page
4. Apply theme to Approvals page
5. Apply theme to Proposals page
6. Create reusable component library
7. Add dark mode support
8. Add accessibility features

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-27  
**Status**: Active

