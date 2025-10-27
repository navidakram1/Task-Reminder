# 🛒 Shopping System - Quick Start Guide

## 🚀 Getting Started

### Step 1: Run Database Migration
```bash
# Push the shopping system schema to Supabase
supabase db push
```

This creates:
- `shopping_lists` table
- `shopping_items` table
- Indexes for performance
- RLS policies for security

### Step 2: Test the Feature

#### On Mobile
```bash
npm start
# Select iOS or Android
```

#### On Web
```bash
npm start
# Select Web
```

### Step 3: Navigate to Shopping
1. Open the app
2. Go to any page
3. Navigate to `/(app)/shopping` to access shopping lists

## 📱 User Guide

### Creating a Shopping List
1. Tap "New List" button
2. Enter list name (e.g., "Weekly Groceries")
3. Add optional description
4. Select a category (Groceries, Household, etc.)
5. Tap "Create List"

### Adding Items
1. Open a shopping list
2. Type item name (e.g., "Tomatoes")
3. Optionally add quantity (e.g., "2 lbs")
4. Tap "+" button
5. Item appears in the list

### Managing Items
- **Mark Complete**: Tap the checkbox next to an item
- **Delete Item**: Tap "✕" and confirm
- **View Progress**: See completion count in header

### Deleting a List
1. From shopping lists overview
2. Tap "⋯" on the list card
3. Tap "Delete"
4. Confirm deletion

## 🎨 UI Components

### Shopping Lists Page
- Header with "New List" button
- List of all shopping lists
- Each list shows:
  - Name and description
  - Item count
  - Completed count
  - Progress bar
  - Delete button

### Shopping List Detail Page
- Header with list name and progress
- List of items with checkboxes
- Input area to add new items
- Real-time updates

### Create List Page
- List name input (required)
- Description input (optional)
- Category selector (8 options)
- Create and Cancel buttons

## 🔧 Technical Details

### API Endpoints Used

**Fetch Shopping Lists**
```typescript
supabase
  .from('shopping_lists')
  .select('*')
  .eq('household_id', householdId)
```

**Add Item**
```typescript
supabase
  .from('shopping_items')
  .insert([{ list_id, name, quantity, completed: false }])
```

**Toggle Completion**
```typescript
supabase
  .from('shopping_items')
  .update({ completed: !completed })
  .eq('id', itemId)
```

**Delete Item**
```typescript
supabase
  .from('shopping_items')
  .delete()
  .eq('id', itemId)
```

### Database Tables

**shopping_lists**
- Stores list metadata
- Linked to households
- Tracks creator

**shopping_items**
- Stores individual items
- Linked to lists
- Tracks completion status

## 🎯 Features

✅ Create multiple shopping lists  
✅ Add items with quantities  
✅ Mark items as completed  
✅ Delete items and lists  
✅ Progress tracking  
✅ Shared access for household members  
✅ Real-time synchronization  
✅ Beautiful UI with animations  
✅ Secure with RLS policies  

## 🐛 Troubleshooting

### Lists Not Showing
- Verify you're part of a household
- Check network connection
- Try refreshing the page

### Can't Add Items
- Ensure item name is not empty
- Check you have write permissions
- Verify list exists

### Items Not Updating
- Refresh the list
- Check network connection
- Verify RLS policies are enabled

## 📊 Data Structure

### Shopping List Object
```typescript
{
  id: string
  household_id: string
  name: string
  description?: string
  created_by: string
  created_at: string
  updated_at: string
  item_count: number
  completed_count: number
}
```

### Shopping Item Object
```typescript
{
  id: string
  list_id: string
  name: string
  quantity?: string
  category?: string
  completed: boolean
  created_at: string
  updated_at: string
}
```

## 🎨 Styling

All components use the centralized theme:

**Colors**
- Primary: #FF6B6B (Coral Red)
- Secondary: #4ECDC4 (Turquoise)
- Success: #10B981 (Green)
- Background: #F8F9FA (Light Gray)
- Surface: #FFFFFF (White)

**Spacing**
- Base: 16px
- Large: 24px
- Small: 8px

## 📱 Responsive Design

- Mobile-first approach
- Optimized for all screen sizes
- Touch-friendly buttons
- Readable text sizes
- Proper spacing and padding

## 🔒 Security

All data is protected by RLS (Row Level Security):
- Users can only see lists in their household
- Users can only modify their household's lists
- Only admins can delete lists
- All queries are filtered by household

## 🚀 Performance

- Indexed database queries
- Lazy loading
- Optimized re-renders
- Smooth 60fps animations
- Minimal bundle size

## 📚 Related Documentation

- `docs/SHOPPING_SYSTEM.md` - Full documentation
- `SHOPPING_SYSTEM_COMPLETE.md` - Implementation summary
- `constants/AppTheme.ts` - Theme configuration
- `supabase/migrations/shopping_system.sql` - Database schema

## 💡 Tips

1. **Organize by Category**: Use categories to organize items
2. **Add Quantities**: Include quantities for better shopping
3. **Share Lists**: All household members can see and edit
4. **Track Progress**: Use the progress bar to stay motivated
5. **Quick Add**: Use the input area to quickly add items

## 🎉 You're Ready!

The shopping system is fully implemented and ready to use. Start creating shopping lists and managing items with your household!

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-27  
**Status**: ✅ Ready to Use

