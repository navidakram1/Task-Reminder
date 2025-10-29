# Household Avatar Implementation Guide

## Quick Start

All changes have been implemented in:
- `app/(app)/dashboard.tsx` - Main dashboard household modal
- `components/HouseholdSwitcher.tsx` - Reusable household switcher component

## What Was Implemented

### 1. Avatar Display in Household Selector
- ✅ Household avatars displayed next to names
- ✅ Custom images from Supabase storage
- ✅ Placeholder icons (🏠 or 👥) with red background
- ✅ 48x48px sizing with proper border radius

### 2. Safe Area Handling
- ✅ `SafeAreaView` from `react-native-safe-area-context`
- ✅ Proper handling of iOS notch/Dynamic Island
- ✅ Proper handling of Android status bar
- ✅ Edge-to-edge header with safe area content

### 3. Visual Enhancements
- ✅ Active indicator: Red circular badge with white checkmark
- ✅ Consistent Coral Red (#FF6B6B) theme
- ✅ Improved spacing and alignment
- ✅ Professional appearance

## Database Setup

### Add Avatar Column (if not exists)
```sql
ALTER TABLE households ADD COLUMN avatar_url VARCHAR(500);
```

### Update Household Creation
When creating a household, optionally include avatar_url:
```typescript
const { data, error } = await supabase
  .from('households')
  .insert({
    name: householdName,
    avatar_url: avatarUrl, // Optional
    // ... other fields
  })
```

## Usage in Components

### Dashboard Modal
The household modal in `app/(app)/dashboard.tsx` automatically:
- Fetches avatar_url from database
- Displays custom avatars or placeholders
- Shows active indicator with red badge
- Handles safe areas properly

### HouseholdSwitcher Component
The reusable component in `components/HouseholdSwitcher.tsx`:
```typescript
<HouseholdSwitcher 
  currentHousehold={household}
  onHouseholdChange={handleHouseholdChange}
/>
```

## Image Upload Integration

To allow users to upload household avatars:

```typescript
import { fileUploadService } from './lib/fileUploadService'

// Upload household avatar
const uploadHouseholdAvatar = async (imageUri: string, householdId: string) => {
  try {
    const result = await fileUploadService.uploadHouseholdAvatar(
      imageUri,
      householdId
    )
    
    // Update household with avatar URL
    const { error } = await supabase
      .from('households')
      .update({ avatar_url: result.url })
      .eq('id', householdId)
    
    if (error) throw error
    return result.url
  } catch (error) {
    console.error('Error uploading avatar:', error)
  }
}
```

## Styling Reference

### Avatar Container
- Width: 48px
- Height: 48px
- Border Radius: 12px
- Margin Right: 12px
- Background: #f0f0f0

### Placeholder Background
- Color: #FF6B6B (Coral Red)
- Icon Size: 24px

### Active Indicator
- Width: 32px
- Height: 32px
- Border Radius: 16px (circular)
- Background: #FF6B6B
- Icon: White checkmark (18px)
- Margin Left: 8px

## Testing Checklist

- [ ] Avatar displays for households with custom images
- [ ] Placeholder shows for households without avatars
- [ ] Active indicator displays correctly
- [ ] Safe area respected on iOS with notch
- [ ] Safe area respected on Android with status bar
- [ ] Header background extends to edges
- [ ] Content stays within safe areas
- [ ] Colors match app theme
- [ ] Spacing and alignment look good
- [ ] Image loading handles errors gracefully

## Troubleshooting

### Avatar Not Displaying
1. Check if `avatar_url` column exists in households table
2. Verify image URL is valid and accessible
3. Check Supabase storage permissions
4. Ensure image is properly uploaded to storage

### Safe Area Issues
1. Verify `react-native-safe-area-context` is installed
2. Check that `SafeAreaView` is imported correctly
3. Ensure `edges` prop is set correctly
4. Test on actual device (simulator may not show notch)

### Styling Issues
1. Verify color values match theme (#FF6B6B)
2. Check border radius values (12px for avatar, 16px for indicator)
3. Ensure sizing is correct (48x48 for avatar, 32x32 for indicator)
4. Verify spacing margins (12px for avatar, 8px for indicator)

## Performance Considerations

- Images are loaded on-demand from Supabase storage
- Placeholder icons use emoji (no additional assets)
- SafeAreaView has minimal performance impact
- Consider caching images for better performance

## Future Enhancements

- [ ] Image caching for faster loading
- [ ] Avatar upload UI in household settings
- [ ] Avatar cropping/editing
- [ ] Animated transitions
- [ ] Skeleton loading states
- [ ] Error boundaries for image loading

## Support

For issues or questions:
1. Check the HOUSEHOLD_SELECTOR_IMPROVEMENTS.md file
2. Review the implementation in the source files
3. Test on actual devices (iOS and Android)
4. Check Supabase storage configuration

