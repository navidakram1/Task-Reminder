# Household Selector/Switcher UI Improvements

## Overview
Implemented comprehensive improvements to the household selector/switcher UI components across the app, including avatar display, proper safe area handling, and enhanced visual design.

## Changes Made

### 1. **Dashboard Household Modal** (`app/(app)/dashboard.tsx`)

#### Imports Updated
- Added `SafeAreaView` and `useSafeAreaInsets` from `react-native-safe-area-context`
- Enables proper handling of notches, status bars, and navigation bars on iOS and Android

#### Household Interface Enhanced
```typescript
interface Household {
  id: string
  name: string
  invite_code: string
  role: string
  member_count: number
  is_default: boolean
  is_active: boolean
  type: string
  avatar_url?: string  // NEW: Optional avatar URL
}
```

#### Database Query Updated
- Modified `fetchUserHouseholds()` to fetch `avatar_url` from households table
- Query now includes: `avatar_url` in the households select statement
- Avatar URL is properly mapped to household objects

#### Main Container - Safe Area Implementation
- Changed main container from `<View>` to `<SafeAreaView>`
- Uses `edges={['top', 'left', 'right']}` to handle safe areas properly
- Header background extends to screen edges while content stays within safe areas
- Properly handles iOS notch/Dynamic Island and Android status bar

#### Household Modal - Safe Area & Avatar Display
- Modal container wrapped with `<SafeAreaView>`
- Removed hardcoded `paddingTop` from modal header (now handled by SafeAreaView)
- Added avatar display section with:
  - **Custom Avatar**: Displays image from `avatar_url` if available
  - **Placeholder Avatar**: Shows emoji icon (🏠 for household, 👥 for group) on red background
  - **Sizing**: 48x48px with 12px border radius
  - **Spacing**: 12px margin to the right of avatar

#### Active Indicator Enhancement
- Changed from simple checkmark text to styled container
- New `modalActiveIndicatorContainer` style:
  - 32x32px circular badge
  - Red background (#FF6B6B) matching app theme
  - White checkmark icon
  - Positioned on the right side of each item

#### New Styles Added
```typescript
modalHouseholdAvatar: {
  width: 48,
  height: 48,
  borderRadius: 12,
  marginRight: 12,
  overflow: 'hidden',
  backgroundColor: '#f0f0f0',
}
modalHouseholdAvatarImage: {
  width: '100%',
  height: '100%',
  resizeMode: 'cover',
}
modalHouseholdAvatarPlaceholder: {
  width: '100%',
  height: '100%',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#FF6B6B',
}
modalHouseholdAvatarIcon: {
  fontSize: 24,
}
modalActiveIndicatorContainer: {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: '#FF6B6B',
  justifyContent: 'center',
  alignItems: 'center',
  marginLeft: 8,
}
modalActiveIndicator: {
  fontSize: 18,
  color: '#FFFFFF',
  fontWeight: '700',
}
```

### 2. **HouseholdSwitcher Component** (`components/HouseholdSwitcher.tsx`)

#### Imports Updated
- Added `Image` from `react-native`
- Added `SafeAreaView` from `react-native-safe-area-context`

#### Household Interface Enhanced
- Added optional `avatar_url?: string` field

#### Modal Implementation
- Wrapped modal container with `<SafeAreaView>`
- Removed hardcoded `paddingTop` from modal header
- Added avatar display with same logic as dashboard modal

#### Avatar Display Implementation
- Conditional rendering: custom image or placeholder
- Placeholder uses emoji icons with red background
- Proper sizing and spacing consistent with dashboard

#### Active Indicator Styling
- Updated to use styled container instead of plain text
- Matches dashboard implementation with red circular badge

#### New Styles Added
- `householdAvatar`: 48x48px container with border radius
- `householdAvatarImage`: Full-width image with cover resize mode
- `householdAvatarPlaceholder`: Red background placeholder
- `householdAvatarIcon`: 24px emoji icon
- `activeIndicatorContainer`: 32x32px red circular badge
- Updated `activeIndicator`: White text in circular badge

## Features Implemented

### ✅ Display Household Avatars
- Avatar/icon displayed next to each household name
- Custom avatar images from Supabase storage if available
- Default placeholder icons (🏠 or 👥) on red background
- Positioned to the left of household name
- 48x48px sizing with 12px border radius

### ✅ Proper System UI Handling
- Uses `SafeAreaView` from `react-native-safe-area-context`
- Respects notches, status bars, and navigation bars
- Edge-to-edge background with safe area content
- Handles iOS (notch, Dynamic Island) and Android (status bar) differences
- Red gradient header extends to screen edges

### ✅ Enhanced Visual Design
- Coral Red (#FF6B6B) and Turquoise theme consistency
- Active household indicator: Red circular badge with white checkmark
- Improved spacing and alignment
- Professional appearance with proper shadows and borders

## Database Requirements

Ensure your `households` table includes:
```sql
avatar_url VARCHAR(500) -- URL to household avatar image
```

If not present, add the column:
```sql
ALTER TABLE households ADD COLUMN avatar_url VARCHAR(500);
```

## Image Loading & Error Handling

The implementation includes:
- Graceful fallback to placeholder if `avatar_url` is null/undefined
- Image component with `resizeMode: 'cover'` for proper scaling
- Overflow hidden to maintain border radius

## Testing Recommendations

1. **Avatar Display**:
   - Test with households that have custom avatars
   - Test with households without avatars (should show placeholder)
   - Verify image loading from Supabase storage

2. **Safe Area Handling**:
   - Test on iOS with notch/Dynamic Island
   - Test on Android with status bar
   - Verify header extends to edges while content stays within safe areas

3. **Visual Design**:
   - Verify active indicator styling
   - Check spacing and alignment
   - Confirm color consistency with app theme

## Files Modified

1. `app/(app)/dashboard.tsx` - Main dashboard with household modal
2. `components/HouseholdSwitcher.tsx` - Reusable household switcher component

## Backward Compatibility

- All changes are backward compatible
- `avatar_url` is optional (nullable)
- Existing households without avatars will display placeholder icons
- No breaking changes to existing functionality

