# 🔍 Advanced Search & Filtering System Guide

## Overview

The SplitDuty app now includes a comprehensive search and filtering system that allows users to quickly find tasks, bills, and household members across the entire app.

## Features Implemented

### ✨ **Global Search**
- **Cross-content Search**: Search tasks, bills, and household members from one place
- **Real-time Results**: Instant search with debounced queries
- **Smart Ranking**: Exact matches appear first, then partial matches
- **Recent Searches**: Quick access to previous search terms
- **Deep Linking**: Tap results to navigate directly to content

### 🎯 **Advanced Filtering**
- **Multi-criteria Filters**: Combine multiple filter conditions
- **Date Range Filtering**: Filter by specific date ranges
- **Status-based Filtering**: Filter by completion status, payment status
- **Category Filtering**: Filter bills by category
- **Amount Range Filtering**: Filter bills by amount ranges
- **Boolean Filters**: Overdue items, items with receipts, etc.

### 📱 **Enhanced List Views**
- **Task List Filtering**: All, To Do, Mine, Done with live counts
- **Bill List Filtering**: All, Unsettled, Settled with status indicators
- **Search Integration**: Search bars in all list views
- **Filter Chips**: Modern UI with active state indicators

## Search Capabilities

### **Task Search**
```typescript
// Search by title and description
const { data: tasks } = await supabase
  .from('tasks')
  .select('*')
  .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
```

**Searchable Fields:**
- Task title
- Task description
- Assignee name
- Due date
- Status
- Recurrence type

### **Bill Search**
```typescript
// Search by title and category
const { data: bills } = await supabase
  .from('bills')
  .select('*')
  .or(`title.ilike.%${query}%,category.ilike.%${query}%`)
```

**Searchable Fields:**
- Bill title
- Category
- Amount
- Date
- Paid by user
- Settlement status

### **Member Search**
```typescript
// Search by name and email
const filteredMembers = members?.filter(member =>
  member.profiles?.name?.toLowerCase().includes(query.toLowerCase()) ||
  member.profiles?.email?.toLowerCase().includes(query.toLowerCase())
)
```

**Searchable Fields:**
- Member name
- Email address
- Role in household

## Advanced Filtering Options

### **Date Range Filtering**
```typescript
interface DateRange {
  start: string | null  // YYYY-MM-DD format
  end: string | null    // YYYY-MM-DD format
}
```

### **Status Filtering**
- **Tasks**: pending, completed, awaiting_approval
- **Bills**: owed, paid, partially_paid

### **Category Filtering** (Bills)
- Groceries, Utilities, Rent, Entertainment, Transportation, Other

### **Amount Range Filtering** (Bills)
```typescript
interface AmountRange {
  min: number | null
  max: number | null
}
```

### **Boolean Filters**
- Show only overdue items
- Show only items with receipts
- Show only recurring tasks

## User Interface Components

### **Global Search Screen**
- **Location**: `/(app)/search`
- **Features**: Cross-content search, recent searches, result categorization
- **Navigation**: Deep links to specific content

### **Advanced Search Modal**
- **Component**: `components/AdvancedSearchModal.tsx`
- **Usage**: Enhanced filtering for tasks and bills
- **Features**: Multi-criteria filtering, reset functionality

### **Enhanced List Views**
- **Task List**: Modern filter chips with counts
- **Bill List**: Status-based filtering with visual indicators
- **Search Integration**: Consistent search experience

## Implementation Examples

### **Basic Search Integration**
```typescript
// In any list component
const [searchQuery, setSearchQuery] = useState('')
const [filteredItems, setFilteredItems] = useState([])

useEffect(() => {
  const filtered = items.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  setFilteredItems(filtered)
}, [items, searchQuery])
```

### **Advanced Filtering**
```typescript
import AdvancedSearchModal, { SearchFilters } from '../components/AdvancedSearchModal'

const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
const [filters, setFilters] = useState<SearchFilters>(defaultFilters)

const applyAdvancedFilters = (newFilters: SearchFilters) => {
  setFilters(newFilters)
  // Apply filters to your data
  const filtered = applyFiltersToData(items, newFilters)
  setFilteredItems(filtered)
}
```

### **Global Search Usage**
```typescript
// Navigate to global search
router.push('/(app)/search')

// Or add search button to navigation
<TouchableOpacity onPress={() => router.push('/(app)/search')}>
  <Text>🔍 Search</Text>
</TouchableOpacity>
```

## Search Performance Optimization

### **Database Indexes**
```sql
-- Add indexes for better search performance
CREATE INDEX idx_tasks_title_gin ON tasks USING gin(to_tsvector('english', title));
CREATE INDEX idx_tasks_description_gin ON tasks USING gin(to_tsvector('english', description));
CREATE INDEX idx_bills_title_gin ON bills USING gin(to_tsvector('english', title));
CREATE INDEX idx_bills_category_gin ON bills USING gin(to_tsvector('english', category));
```

### **Query Optimization**
- Use `ilike` for case-insensitive search
- Limit results to prevent performance issues
- Use debounced search to reduce API calls
- Implement pagination for large result sets

### **Client-side Optimization**
- Debounce search queries (300ms delay)
- Cache recent search results
- Implement virtual scrolling for large lists
- Use React.memo for search result components

## Search Analytics

### **Track Search Usage**
```typescript
// Log search queries for analytics
const logSearch = async (query: string, resultCount: number) => {
  await supabase
    .from('search_logs')
    .insert({
      user_id: user.id,
      query: query,
      result_count: resultCount,
      timestamp: new Date().toISOString()
    })
}
```

### **Popular Searches**
```sql
-- Get most popular search terms
SELECT 
  query,
  COUNT(*) as search_count,
  AVG(result_count) as avg_results
FROM search_logs 
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY query 
ORDER BY search_count DESC 
LIMIT 10;
```

## Accessibility Features

### **Screen Reader Support**
- Proper ARIA labels for search inputs
- Descriptive text for filter states
- Keyboard navigation support

### **Voice Search** (Future Enhancement)
```typescript
// Potential voice search integration
import { Speech } from 'expo-speech'

const startVoiceSearch = async () => {
  // Implementation for voice-to-text search
}
```

## Future Enhancements

### **Planned Features**
1. **Saved Searches**: Save frequently used filter combinations
2. **Search Suggestions**: Auto-complete based on existing content
3. **Fuzzy Search**: Handle typos and similar terms
4. **Search Shortcuts**: Quick filters for common searches
5. **Export Search Results**: Export filtered data to CSV/PDF

### **Advanced Search Options**
1. **Full-text Search**: PostgreSQL full-text search capabilities
2. **Semantic Search**: AI-powered content understanding
3. **Search History**: Detailed search history with timestamps
4. **Search Sharing**: Share search results with household members

## Troubleshooting

### **Common Issues**
1. **Slow Search**: Check database indexes and query optimization
2. **No Results**: Verify search terms and filter combinations
3. **Outdated Results**: Ensure real-time data synchronization
4. **UI Performance**: Implement virtualization for large result sets

### **Debug Search Queries**
```typescript
// Enable search debugging
const debugSearch = true

if (debugSearch) {
  console.log('Search query:', query)
  console.log('Applied filters:', filters)
  console.log('Result count:', results.length)
}
```

## Testing

### **Search Test Cases**
1. Empty search queries
2. Special characters in search
3. Very long search terms
4. Multiple filter combinations
5. Search result navigation
6. Performance with large datasets

The advanced search and filtering system is now ready to help users find exactly what they need! 🔍✨
