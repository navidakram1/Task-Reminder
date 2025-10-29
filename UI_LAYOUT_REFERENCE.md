# Household Selector UI Layout Reference

## Household Modal Layout

### Modal Header (with SafeAreaView)
```
┌─────────────────────────────────────────────────┐
│ [Safe Area Top - iOS Notch/Android Status Bar]  │
├─────────────────────────────────────────────────┤
│  Switch Household                            ✕  │
├─────────────────────────────────────────────────┤
```

### Household List Item - With Avatar

#### Active Household
```
┌─────────────────────────────────────────────────┐
│ ┌────┐                                           │
│ │ 🏠 │  My Apartment              ✓ (in badge)  │
│ │    │  4 members                                │
│ └────┘                                           │
└─────────────────────────────────────────────────┘
```

#### Inactive Household
```
┌─────────────────────────────────────────────────┐
│ ┌────┐                                           │
│ │ 👥 │  Roommates Group                          │
│ │    │  3 members                                │
│ └────┘                                           │
└─────────────────────────────────────────────────┘
```

#### With Custom Avatar
```
┌─────────────────────────────────────────────────┐
│ ┌────┐                                           │
│ │ 🖼️ │  Beach House                             │
│ │    │  6 members                                │
│ └────┘                                           │
└─────────────────────────────────────────────────┘
```

## Component Dimensions

### Avatar Container
```
Width:        48px
Height:       48px
Border Radius: 12px
Margin Right:  12px
Background:   #f0f0f0 (light gray)
```

### Avatar Placeholder
```
Background:   #FF6B6B (Coral Red)
Icon Size:    24px
Icon Type:    🏠 (household) or 👥 (group)
```

### Active Indicator Badge
```
Width:         32px
Height:        32px
Border Radius: 16px (circular)
Background:    #FF6B6B (Coral Red)
Icon:          ✓ (white checkmark)
Icon Size:     18px
Margin Left:   8px
```

## Household Item Layout

### Horizontal Layout
```
┌─────────────────────────────────────────────────────────┐
│ [Avatar] [Name & Meta Info]              [Indicator]    │
│ 48x48px  [Household Name]                [32x32px]      │
│          [Member Count]                                 │
└─────────────────────────────────────────────────────────┘
```

### Spacing Details
```
Item Padding:        12px (vertical), 12px (horizontal)
Avatar Margin Right: 12px
Info Flex:           1 (takes remaining space)
Indicator Margin:    8px (left)
Item Margin Bottom:  8px
```

## Color Scheme

### Primary Colors
- **Coral Red**: #FF6B6B (avatars, active indicator, accents)
- **White**: #FFFFFF (text on red backgrounds)
- **Light Gray**: #f0f0f0 (avatar placeholder background)

### Text Colors
- **Primary Text**: #1a1a1a (household name)
- **Secondary Text**: #666 (member count)
- **Active Text**: #FF6B6B (active household name)

### Background Colors
- **Item Background**: #f8f9fa (inactive)
- **Item Active Background**: #e3f2fd (active)
- **Modal Background**: #fff (white)

## Safe Area Handling

### Main Dashboard
```
┌─────────────────────────────────────────────────┐
│ [Safe Area - Top]                               │
├─────────────────────────────────────────────────┤
│ [Header with Logo - Extends to edges]           │
├─────────────────────────────────────────────────┤
│ [Content - Within safe areas]                   │
│ [Household Selector]                            │
│ [Quick Actions]                                 │
│ [Tasks & Bills]                                 │
└─────────────────────────────────────────────────┘
```

### Modal View
```
┌─────────────────────────────────────────────────┐
│ [Safe Area - Top]                               │
├─────────────────────────────────────────────────┤
│ Switch Household                            ✕   │
├─────────────────────────────────────────────────┤
│ [Household List - Within safe areas]            │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Avatar] Household 1                    ✓   │ │
│ ├─────────────────────────────────────────────┤ │
│ │ [Avatar] Household 2                        │ │
│ ├─────────────────────────────────────────────┤ │
│ │ [Avatar] Household 3                        │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Responsive Behavior

### Portrait Mode
- Full width household items
- Avatar: 48x48px
- Indicator: 32x32px
- Padding: 12px horizontal

### Landscape Mode
- Same layout (responsive)
- Avatar: 48x48px (unchanged)
- Indicator: 32x32px (unchanged)
- Padding: 12px horizontal

## Image Loading States

### Loading State
```
┌────┐
│ ⏳ │  (placeholder shown while loading)
└────┘
```

### Loaded State
```
┌────┐
│ 🖼️ │  (custom image displayed)
└────┘
```

### Error State
```
┌────┐
│ 🏠 │  (fallback to emoji icon)
└────┘
```

## Typography

### Household Name
- Font Size: 16px
- Font Weight: 600 (semi-bold)
- Color: #1a1a1a (normal) or #FF6B6B (active)

### Member Count
- Font Size: 14px
- Font Weight: 400 (normal)
- Color: #666

### Modal Title
- Font Size: 18px
- Font Weight: 600 (semi-bold)
- Color: #1a1a1a

## Shadows & Elevation

### Household Item
- Shadow Color: #000
- Shadow Offset: 0, 2px
- Shadow Opacity: 0.05
- Shadow Radius: 4px
- Elevation (Android): 2

### Active Item Border
- Border Width: 2px
- Border Color: #FF6B6B

## Animation & Interactions

### Tap Feedback
- Opacity: 0.8 on press
- No scale animation (native feel)

### Modal Animation
- Type: Slide
- Presentation: Page Sheet
- Duration: Default (300ms)

### Transitions
- Smooth color transitions on active state
- No jarring changes

## Accessibility

### Touch Targets
- Minimum: 44x44px (household item height)
- Avatar: 48x48px (exceeds minimum)
- Indicator: 32x32px (close to minimum)

### Color Contrast
- Text on white: ✓ WCAG AA
- White on red: ✓ WCAG AAA
- Text on light gray: ✓ WCAG AA

### Labels
- Household name clearly visible
- Member count provides context
- Active indicator visually distinct

