# 🛒 Shopping System - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Shopping System                          │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
        ┌───────▼────────┐ ┌──▼──────────┐ ┌──▼──────────┐
        │  Shopping      │ │  Shopping   │ │  Create     │
        │  Lists Page    │ │  List       │ │  List Page  │
        │  (index.tsx)   │ │  Detail     │ │ (create.tsx)│
        │                │ │  ([id].tsx) │ │             │
        └────────────────┘ └─────────────┘ └─────────────┘
                │                │                │
                └────────────────┼────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Supabase Client      │
                    │  (supabase.ts)         │
                    └────────────┬────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
        ┌───────▼────────┐ ┌─────▼──────────┐ ┌──▼──────────┐
        │ shopping_lists │ │shopping_items  │ │   Auth      │
        │    Table       │ │    Table       │ │  (Users)    │
        │                │ │                │ │             │
        │ - id (PK)      │ │ - id (PK)      │ │ - id (PK)   │
        │ - household_id │ │ - list_id (FK) │ │ - email     │
        │ - name         │ │ - name         │ │ - phone     │
        │ - description  │ │ - quantity     │ │             │
        │ - created_by   │ │ - category     │ │             │
        │ - created_at   │ │ - completed    │ │             │
        │ - updated_at   │ │ - created_at   │ │             │
        │                │ │ - updated_at   │ │             │
        └────────────────┘ └────────────────┘ └─────────────┘
```

## Data Flow

### Creating a Shopping List
```
User Input
    │
    ▼
Create List Page
    │
    ├─ Validate input
    ├─ Get household ID
    │
    ▼
Supabase Insert
    │
    ├─ Check RLS policy
    ├─ Insert into shopping_lists
    │
    ▼
Success/Error
    │
    ├─ Navigate to list detail
    └─ Show error alert
```

### Adding an Item
```
User Input (name + quantity)
    │
    ▼
List Detail Page
    │
    ├─ Validate item name
    │
    ▼
Supabase Insert
    │
    ├─ Check RLS policy
    ├─ Insert into shopping_items
    │
    ▼
Update Local State
    │
    ├─ Add item to list
    ├─ Clear input fields
    │
    ▼
UI Update
    │
    └─ Show new item with animation
```

### Marking Item Complete
```
User Tap Checkbox
    │
    ▼
Toggle Completion
    │
    ├─ Update local state
    │
    ▼
Supabase Update
    │
    ├─ Check RLS policy
    ├─ Update completed status
    │
    ▼
UI Update
    │
    ├─ Strikethrough text
    ├─ Update progress bar
    │
    ▼
Complete
```

## Component Hierarchy

```
Shopping System
├── Shopping Lists Page (index.tsx)
│   ├── Header
│   │   ├── Title
│   │   └── New List Button
│   ├── List Container
│   │   └── List Card (repeating)
│   │       ├── List Info
│   │       │   ├── Name
│   │       │   └── Description
│   │       ├── Stats
│   │       │   ├── Item Count
│   │       │   ├── Completed Count
│   │       │   └── Progress Bar
│   │       └── Delete Button
│   └── Empty State
│
├── Shopping List Detail ([id].tsx)
│   ├── Header
│   │   ├── List Name
│   │   └── Progress Info
│   ├── Items List
│   │   └── Item Card (repeating)
│   │       ├── Checkbox
│   │       ├── Item Info
│   │       │   ├── Name
│   │       │   └── Quantity
│   │       └── Delete Button
│   ├── Empty State
│   └── Input Area
│       ├── Item Name Input
│       ├── Quantity Input
│       └── Add Button
│
└── Create List Page (create.tsx)
    ├── List Name Input
    ├── Description Input
    ├── Category Selector
    │   └── Category Button (repeating)
    ├── Hint Text
    └── Footer
        ├── Cancel Button
        └── Create Button
```

## State Management

### Shopping Lists Page
```typescript
const [lists, setLists] = useState<ShoppingList[]>([])
const [loading, setLoading] = useState(true)
const [refreshing, setRefreshing] = useState(false)
```

### Shopping List Detail
```typescript
const [listName, setListName] = useState('')
const [items, setItems] = useState<ShoppingItem[]>([])
const [newItemName, setNewItemName] = useState('')
const [newItemQuantity, setNewItemQuantity] = useState('')
const [loading, setLoading] = useState(true)
const [refreshing, setRefreshing] = useState(false)
```

### Create List Page
```typescript
const [listName, setListName] = useState('')
const [description, setDescription] = useState('')
const [selectedCategory, setSelectedCategory] = useState('')
const [loading, setLoading] = useState(false)
```

## Database Relationships

```
┌──────────────────┐
│   Households     │
│   (existing)     │
└────────┬─────────┘
         │ 1
         │
         │ N
         ▼
┌──────────────────────┐
│  shopping_lists      │
│  - id (PK)           │
│  - household_id (FK) │◄─── Relationship
│  - name              │
│  - description       │
│  - created_by        │
└────────┬─────────────┘
         │ 1
         │
         │ N
         ▼
┌──────────────────────┐
│  shopping_items      │
│  - id (PK)           │
│  - list_id (FK)      │◄─── Relationship
│  - name              │
│  - quantity          │
│  - category          │
│  - completed         │
└──────────────────────┘
```

## API Calls

### Fetch Shopping Lists
```
GET /shopping_lists
├─ Filter: household_id = current_household
├─ Order: created_at DESC
└─ Count items for each list
```

### Create Shopping List
```
POST /shopping_lists
├─ Input: name, description, household_id, created_by
└─ Return: created list with id
```

### Fetch List Items
```
GET /shopping_items
├─ Filter: list_id = current_list
├─ Order: completed ASC, created_at DESC
└─ Return: all items
```

### Add Item
```
POST /shopping_items
├─ Input: list_id, name, quantity, completed
└─ Return: created item
```

### Update Item
```
PATCH /shopping_items
├─ Filter: id = item_id
├─ Update: completed status
└─ Return: updated item
```

### Delete Item
```
DELETE /shopping_items
├─ Filter: id = item_id
└─ Return: success/error
```

## Security Model

### RLS Policies

**shopping_lists**
- SELECT: User in household
- INSERT: User in household
- UPDATE: User in household
- DELETE: Creator or admin

**shopping_items**
- SELECT: User in household
- INSERT: User in household
- UPDATE: User in household
- DELETE: User in household

### Data Isolation
- Lists are household-specific
- Items are list-specific
- Users can only access their household's data
- No cross-household data leakage

## Performance Optimization

### Indexes
```sql
- shopping_lists(household_id)
- shopping_lists(created_by)
- shopping_items(list_id)
- shopping_items(completed)
```

### Query Optimization
- Fetch lists with item counts in parallel
- Use pagination for large lists (future)
- Cache household ID
- Lazy load items

### UI Optimization
- Memoized components
- Optimized re-renders
- Smooth animations (60fps)
- Efficient state updates

## Error Handling

### Network Errors
- Show error alert
- Provide retry option
- Graceful degradation

### Validation Errors
- Validate input before submit
- Show inline error messages
- Disable submit button if invalid

### Permission Errors
- Check RLS policies
- Show appropriate error message
- Redirect if unauthorized

## Future Enhancements

```
Shopping System v2.0
├── Item Categories
│   ├── Predefined categories
│   ├── Custom categories
│   └── Category icons
├── Price Tracking
│   ├── Item prices
│   ├── Total cost
│   └── Price history
├── Templates
│   ├── Save as template
│   ├── Reuse templates
│   └── Share templates
├── Notifications
│   ├── Incomplete list reminders
│   ├── Item added notifications
│   └── List shared notifications
├── Barcode Scanning
│   ├── Scan items
│   ├── Auto-populate details
│   └── Price lookup
└── Analytics
    ├── Shopping history
    ├── Spending trends
    └── Favorite items
```

## File Structure

```
app/(app)/shopping/
├── _layout.tsx (30 lines)
│   └─ Navigation setup
├── index.tsx (300+ lines)
│   └─ Shopping lists overview
├── [id].tsx (300+ lines)
│   └─ Shopping list detail
└── create.tsx (300+ lines)
    └─ Create new list

supabase/migrations/
└── shopping_system.sql (150+ lines)
    ├─ Table definitions
    ├─ Indexes
    └─ RLS policies

docs/
├── SHOPPING_SYSTEM.md (300+ lines)
│   └─ Full documentation
├── SHOPPING_QUICK_START.md (200+ lines)
│   └─ Quick start guide
└── SHOPPING_SYSTEM_ARCHITECTURE.md (this file)
    └─ Architecture overview
```

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-27  
**Status**: ✅ Complete

