# 🛒 Shopping System Documentation

## Overview

The Shopping System is a comprehensive feature that allows households to create and manage shared shopping lists. Members can add items, track quantities, mark items as completed, and collaborate on shopping tasks.

## Features

### 1. Shopping Lists
- **Create Lists**: Create multiple shopping lists for different purposes
- **List Management**: View, edit, and delete shopping lists
- **Progress Tracking**: See completion percentage for each list
- **Shared Access**: All household members can access and edit lists

### 2. Shopping Items
- **Add Items**: Add items with name and quantity
- **Item Tracking**: Mark items as completed
- **Quantity Support**: Track quantities (e.g., "2 lbs", "1 can")
- **Categories**: Organize items by category (Groceries, Household, etc.)

### 3. Collaboration
- **Real-time Updates**: Changes sync across all household members
- **Shared Responsibility**: Anyone can add, complete, or remove items
- **Activity Tracking**: See who created each list

## File Structure

```
app/(app)/shopping/
├── _layout.tsx          # Navigation layout
├── index.tsx            # Shopping lists overview
├── [id].tsx             # Shopping list detail & items
└── create.tsx           # Create new shopping list

supabase/migrations/
└── shopping_system.sql  # Database schema & RLS policies

docs/
└── SHOPPING_SYSTEM.md   # This file
```

## Database Schema

### shopping_lists Table
```sql
- id (UUID, PK)
- household_id (UUID, FK)
- name (TEXT)
- description (TEXT, optional)
- created_by (UUID, FK)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### shopping_items Table
```sql
- id (UUID, PK)
- list_id (UUID, FK)
- name (TEXT)
- quantity (TEXT, optional)
- category (TEXT, optional)
- completed (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## User Flows

### Creating a Shopping List
1. User taps "New List" button
2. Enters list name (required)
3. Optionally adds description
4. Selects a category
5. Taps "Create List"
6. Redirected to list detail page

### Adding Items to a List
1. User opens a shopping list
2. Enters item name in input field
3. Optionally enters quantity
4. Taps "+" button to add
5. Item appears in the list

### Managing Items
- **Mark Complete**: Tap checkbox to mark item as done
- **Delete Item**: Tap "✕" button and confirm deletion
- **View Progress**: See completion count in header

### Viewing All Lists
1. User navigates to Shopping section
2. Sees all household shopping lists
3. Each list shows:
   - List name
   - Item count
   - Completed count
   - Progress bar

## Styling & Theme

All components use the centralized `APP_THEME` from `constants/AppTheme.ts`:

- **Primary Color**: Coral Red (#FF6B6B) - for buttons and highlights
- **Secondary Color**: Turquoise (#4ECDC4) - for accents
- **Background**: Light Gray (#F8F9FA)
- **Surface**: White (#FFFFFF)
- **Success**: Green (#10B981) - for completed items

### Component Styles

**Shopping List Card**
- Left border in primary color
- Progress bar showing completion percentage
- Item and completion counts

**Shopping Item Card**
- Checkbox for completion status
- Item name with strikethrough when completed
- Quantity display
- Delete button

**Input Area**
- Item name input (flexible width)
- Quantity input (fixed width)
- Add button (primary color)

## Animations

- **Fade In**: 250ms - List and item appearance
- **Slide In**: 300ms - Item additions
- **Scale**: 200ms - Button interactions

## Security (RLS Policies)

### shopping_lists
- **SELECT**: Users can view lists in their household
- **INSERT**: Users can create lists in their household
- **UPDATE**: Users can update lists in their household
- **DELETE**: Only list creator or household admin can delete

### shopping_items
- **SELECT**: Users can view items in their household's lists
- **INSERT**: Users can add items to their household's lists
- **UPDATE**: Users can update items in their household's lists
- **DELETE**: Users can delete items from their household's lists

## API Integration

### Fetch Shopping Lists
```typescript
const { data: listsData } = await supabase
  .from('shopping_lists')
  .select('*')
  .eq('household_id', householdId)
  .order('created_at', { ascending: false })
```

### Add Shopping Item
```typescript
const { data } = await supabase
  .from('shopping_items')
  .insert([{
    list_id: id,
    name: itemName,
    quantity: itemQuantity,
    completed: false,
  }])
  .select()
```

### Toggle Item Completion
```typescript
const { error } = await supabase
  .from('shopping_items')
  .update({ completed: !completed })
  .eq('id', itemId)
```

## Future Enhancements

1. **Item Categories**: Better organization with predefined categories
2. **Sharing**: Share lists with specific people outside household
3. **Templates**: Save and reuse common shopping lists
4. **Price Tracking**: Add prices and calculate total cost
5. **Barcode Scanning**: Scan items to add to list
6. **Notifications**: Remind members about incomplete lists
7. **History**: Track past shopping lists and items
8. **Favorites**: Quick-add frequently purchased items

## Troubleshooting

### Lists Not Loading
- Check household membership
- Verify RLS policies are enabled
- Check network connection

### Items Not Saving
- Ensure list ID is valid
- Check user has write permissions
- Verify item name is not empty

### Completion Status Not Updating
- Refresh the list
- Check for network issues
- Verify RLS policies allow updates

## Performance Considerations

- **Indexes**: Created on household_id, created_by, list_id, and completed
- **Pagination**: Consider adding for large lists (100+ items)
- **Caching**: Items are fetched fresh on each view
- **Real-time**: Consider adding Supabase subscriptions for live updates

## Testing

### Manual Testing Checklist
- [ ] Create shopping list
- [ ] Add items to list
- [ ] Mark items as complete
- [ ] Delete items
- [ ] Delete shopping list
- [ ] View progress bar
- [ ] Test on iOS, Android, Web
- [ ] Test with multiple users
- [ ] Test offline behavior

## Related Features

- **Household Management**: Shopping lists are household-specific
- **User Authentication**: Lists are user-specific via household membership
- **Notifications**: Could integrate with notification system for reminders

