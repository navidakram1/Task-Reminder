# Tab Bar Icon Reference

## Main Navigation Icons

### 🏠 Home / Dashboard
- **Inactive**: `home-outline`
- **Active**: `home`
- **Color (Active)**: White on #667eea background
- **Color (Inactive)**: #8e8e93
- **Purpose**: Navigate to main dashboard

### ✅ Tasks
- **Inactive**: `checkmark-circle-outline`
- **Active**: `checkmark-circle`
- **Color (Active)**: White on #667eea background
- **Color (Inactive)**: #8e8e93
- **Purpose**: View and manage tasks

### 💰 Bills
- **Inactive**: `wallet-outline`
- **Active**: `wallet`
- **Color (Active)**: White on #667eea background
- **Color (Inactive)**: #8e8e93
- **Purpose**: Manage bills and payments

### ⭐ Review / Approvals
- **Inactive**: `star-outline`
- **Active**: `star`
- **Color (Active)**: White on #667eea background
- **Color (Inactive)**: #8e8e93
- **Purpose**: Review and approve tasks

### 📋 Proposals
- **Inactive**: `document-text-outline`
- **Active**: `document-text`
- **Color (Active)**: White on #667eea background
- **Color (Inactive)**: #8e8e93
- **Purpose**: Create and view proposals

### ⚙️ Settings
- **Inactive**: `settings-outline`
- **Active**: `settings`
- **Color (Active)**: White on #667eea background
- **Color (Inactive)**: #8e8e93
- **Purpose**: App settings and preferences

## Quick Action Icons (Plus Button Menu)

### ➕ New Task
- **Icon**: `add-circle`
- **Color**: #667eea (Indigo)
- **Background**: #667eea15 (15% opacity)
- **Route**: `/(app)/tasks/create`
- **Description**: Create a new task

### 💵 Add Bill
- **Icon**: `cash`
- **Color**: #10b981 (Green)
- **Background**: #10b98115 (15% opacity)
- **Route**: `/(app)/bills/create`
- **Description**: Split a new bill

### 📝 New Proposal
- **Icon**: `clipboard`
- **Color**: #f59e0b (Orange)
- **Background**: #f59e0b15 (15% opacity)
- **Route**: `/(app)/proposals/create`
- **Description**: Create a proposal

### ⭐ Add Review
- **Icon**: `star-half`
- **Color**: #ec4899 (Pink)
- **Background**: #ec489915 (15% opacity)
- **Route**: `/(app)/approvals/create`
- **Description**: Submit for review

## Plus Button
- **Icon**: `add`
- **Size**: 32px
- **Color**: #ffffff (White)
- **Background**: #667eea (Indigo)
- **Purpose**: Open quick actions menu

## Icon Specifications

### Sizes
- **Tab Icons (Inactive)**: 24px
- **Tab Icons (Active)**: 26px
- **Plus Button Icon**: 32px
- **Quick Action Icons**: 24px

### Colors
| State/Type | Color | Hex Code |
|------------|-------|----------|
| Active Icon | White | #ffffff |
| Inactive Icon | Gray | #8e8e93 |
| Active Background | Indigo | #667eea |
| Task Action | Indigo | #667eea |
| Bill Action | Green | #10b981 |
| Proposal Action | Orange | #f59e0b |
| Review Action | Pink | #ec4899 |

### Icon Containers
- **Tab Icon Container**: 48px × 48px, 24px border radius
- **Quick Action Container**: 52px × 52px, 26px border radius
- **Plus Button**: 68px × 68px, 34px border radius

## Alternative Icon Options

If you want to change icons, here are some good alternatives from Ionicons:

### Home Alternatives
- `home-sharp`
- `apps`
- `grid`

### Tasks Alternatives
- `checkbox`
- `list`
- `checkmark-done-circle`

### Bills Alternatives
- `card`
- `cash-outline`
- `receipt`

### Review Alternatives
- `thumbs-up`
- `heart`
- `ribbon`

### Proposals Alternatives
- `document`
- `clipboard-outline`
- `create`

### Settings Alternatives
- `cog`
- `options`
- `ellipsis-horizontal-circle`

## How to Change Icons

### 1. Update Tab Icons
Edit `components/navigation/CustomTabBar.tsx`:

```typescript
const tabs: TabItem[] = [
  { name: 'dashboard', title: 'Home', icon: 'YOUR_ICON_NAME', route: '/(app)/dashboard' },
  // ... other tabs
]
```

### 2. Update Quick Action Icons
```typescript
const quickActions: QuickAction[] = [
  {
    title: 'New Task',
    icon: 'YOUR_ICON_NAME',
    route: '/(app)/tasks/create',
    description: 'Create a new task',
    color: '#667eea'
  },
  // ... other actions
]
```

### 3. Browse Available Icons
Visit [Ionicons.com](https://ionic.io/ionicons) to browse all available icons.

## Icon Naming Convention

Ionicons uses a consistent naming pattern:
- **Outline**: `icon-name-outline` (thin, hollow)
- **Filled**: `icon-name` (solid, filled)
- **Sharp**: `icon-name-sharp` (angular, sharp edges)

For tabs, we use:
- **Inactive**: `-outline` variant
- **Active**: filled variant (no suffix)

## Accessibility

All icons should have:
- **Minimum size**: 24px for touch targets
- **Clear contrast**: Against background
- **Semantic meaning**: Icon matches function
- **Text labels**: Always paired with text

## Best Practices

1. **Consistency**: Use the same icon family (Ionicons)
2. **Recognition**: Choose universally recognized symbols
3. **Simplicity**: Avoid overly complex icons
4. **Contrast**: Ensure icons are visible in all states
5. **Size**: Keep icons proportional to containers
6. **Color**: Use brand colors for active states

## Testing Icons

Before finalizing icon changes:
1. Test on multiple screen sizes
2. Verify in light and dark modes
3. Check accessibility contrast ratios
4. Get user feedback on recognizability
5. Ensure icons render correctly on all platforms

---

**Icon Library**: Ionicons v7.x  
**Total Icons Available**: 1,300+  
**License**: MIT  
**Documentation**: https://ionic.io/ionicons

