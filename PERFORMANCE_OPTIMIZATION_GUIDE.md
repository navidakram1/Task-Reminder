# ⚡ Performance Optimization Guide

## Overview

This guide outlines comprehensive performance optimization strategies for the SplitDuty app to ensure fast, smooth, and efficient operation across all devices.

## 🚀 React Native Performance Optimizations

### 1. Component Optimization

#### Use React.memo for Pure Components

```typescript
// Optimize list items that don't change frequently
const TaskItem = React.memo(({ task, onPress }) => (
  <TouchableOpacity style={styles.taskItem} onPress={onPress}>
    <Text>{task.title}</Text>
    <Text>{task.status}</Text>
  </TouchableOpacity>
))

// Only re-render when task data actually changes
const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.status === nextProps.task.status
  )
}

export default React.memo(TaskItem, areEqual)
```

#### Optimize useCallback and useMemo

```typescript
const TaskList = ({ tasks, onTaskPress }) => {
  // Memoize expensive calculations
  const sortedTasks = useMemo(() => {
    return tasks.sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
  }, [tasks])

  // Memoize callback functions
  const handleTaskPress = useCallback((taskId) => {
    onTaskPress(taskId)
  }, [onTaskPress])

  // Memoize filtered data
  const pendingTasks = useMemo(() => {
    return sortedTasks.filter(task => task.status === 'pending')
  }, [sortedTasks])

  return (
    <FlatList
      data={pendingTasks}
      renderItem={({ item }) => (
        <TaskItem task={item} onPress={() => handleTaskPress(item.id)} />
      )}
      keyExtractor={(item) => item.id}
    />
  )
}
```

### 2. List Performance

#### Use FlatList for Large Lists

```typescript
const OptimizedTaskList = ({ tasks }) => {
  const renderTask = useCallback(({ item }) => (
    <TaskItem task={item} />
  ), [])

  const getItemLayout = useCallback((data, index) => ({
    length: 80, // Fixed item height
    offset: 80 * index,
    index,
  }), [])

  return (
    <FlatList
      data={tasks}
      renderItem={renderTask}
      keyExtractor={(item) => item.id}
      getItemLayout={getItemLayout} // Improves scroll performance
      removeClippedSubviews={true} // Remove off-screen items
      maxToRenderPerBatch={10} // Render 10 items per batch
      windowSize={10} // Keep 10 screens worth of items
      initialNumToRender={10} // Render 10 items initially
      updateCellsBatchingPeriod={50} // Batch updates every 50ms
    />
  )
}
```

#### Implement Virtual Scrolling for Very Large Lists

```typescript
import { VirtualizedList } from 'react-native'

const VirtualTaskList = ({ tasks }) => {
  const getItem = (data, index) => data[index]
  const getItemCount = (data) => data.length

  return (
    <VirtualizedList
      data={tasks}
      initialNumToRender={4}
      renderItem={({ item }) => <TaskItem task={item} />}
      keyExtractor={(item) => item.id}
      getItemCount={getItemCount}
      getItem={getItem}
    />
  )
}
```

### 3. Image Optimization

#### Optimize Image Loading

```typescript
import FastImage from 'react-native-fast-image'

const OptimizedImage = ({ uri, style }) => (
  <FastImage
    style={style}
    source={{
      uri,
      priority: FastImage.priority.normal,
      cache: FastImage.cacheControl.immutable,
    }}
    resizeMode={FastImage.resizeMode.cover}
  />
)

// For profile photos with placeholder
const ProfilePhoto = ({ uri, size = 40 }) => (
  <FastImage
    style={{ width: size, height: size, borderRadius: size / 2 }}
    source={{
      uri: uri || 'https://via.placeholder.com/40',
      priority: FastImage.priority.low,
    }}
    fallback={true}
  />
)
```

### 4. Navigation Optimization

#### Lazy Load Screens

```typescript
import { lazy, Suspense } from 'react'

// Lazy load heavy screens
const TaskDetailsScreen = lazy(() => import('./TaskDetailsScreen'))
const BillAnalyticsScreen = lazy(() => import('./BillAnalyticsScreen'))

const AppNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="TaskDetails" 
      component={(props) => (
        <Suspense fallback={<LoadingScreen />}>
          <TaskDetailsScreen {...props} />
        </Suspense>
      )} 
    />
  </Stack.Navigator>
)
```

## 📊 Database Performance

### 1. Query Optimization

#### Use Efficient Supabase Queries

```typescript
// Bad: Fetching all data then filtering
const fetchAllTasks = async () => {
  const { data } = await supabase.from('tasks').select('*')
  return data.filter(task => task.status === 'pending')
}

// Good: Filter on the server
const fetchPendingTasks = async () => {
  const { data } = await supabase
    .from('tasks')
    .select('id, title, status, due_date') // Only select needed fields
    .eq('status', 'pending')
    .order('due_date', { ascending: true })
    .limit(50) // Limit results
  return data
}
```

#### Implement Pagination

```typescript
const usePaginatedTasks = (pageSize = 20) => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const loadMore = async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data.length < pageSize) {
        setHasMore(false)
      }

      setTasks(prev => [...prev, ...data])
      setPage(prev => prev + 1)
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  return { tasks, loading, hasMore, loadMore }
}
```

### 2. Caching Strategy

#### Implement Smart Caching

```typescript
class CacheManager {
  private cache = new Map()
  private TTL = 5 * 60 * 1000 // 5 minutes

  set(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  get(key: string) {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  clear() {
    this.cache.clear()
  }
}

const cacheManager = new CacheManager()

// Use cache in data fetching
const fetchTasksWithCache = async (householdId: string) => {
  const cacheKey = `tasks_${householdId}`
  const cached = cacheManager.get(cacheKey)
  
  if (cached) {
    return cached
  }

  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('household_id', householdId)

  cacheManager.set(cacheKey, data)
  return data
}
```

## 🎯 Bundle Size Optimization

### 1. Code Splitting

```typescript
// Split large utilities
const heavyUtils = lazy(() => import('./heavyUtils'))

// Dynamic imports for features
const loadAnalytics = async () => {
  const { AnalyticsService } = await import('./services/AnalyticsService')
  return new AnalyticsService()
}
```

### 2. Tree Shaking

```typescript
// Bad: Imports entire library
import * as _ from 'lodash'

// Good: Import only what you need
import debounce from 'lodash/debounce'
import throttle from 'lodash/throttle'

// Or use smaller alternatives
const debounce = (func, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}
```

### 3. Asset Optimization

```bash
# Optimize images before bundling
npx expo optimize

# Use WebP format for images
# Compress images to appropriate sizes
# Use vector icons instead of image icons
```

## 🔧 Runtime Performance

### 1. Memory Management

```typescript
// Clean up subscriptions and timers
useEffect(() => {
  const subscription = supabase
    .channel('tasks')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, 
      (payload) => {
        // Handle real-time updates
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}, [])

// Clean up intervals
useEffect(() => {
  const interval = setInterval(() => {
    // Periodic task
  }, 30000)

  return () => clearInterval(interval)
}, [])
```

### 2. Debounce Expensive Operations

```typescript
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Use in search
const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 300)

  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery)
    }
  }, [debouncedQuery])

  return (
    <TextInput
      value={searchQuery}
      onChangeText={setSearchQuery}
      placeholder="Search..."
    />
  )
}
```

## 📱 Platform-Specific Optimizations

### iOS Optimizations

```typescript
// Use native iOS components when available
import { ActionSheetIOS, Platform } from 'react-native'

const showActionSheet = () => {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions({
      options: ['Cancel', 'Delete', 'Edit'],
      destructiveButtonIndex: 1,
      cancelButtonIndex: 0,
    }, (buttonIndex) => {
      // Handle selection
    })
  }
}
```

### Android Optimizations

```typescript
// Use Android-specific optimizations
import { ToastAndroid, Platform } from 'react-native'

const showToast = (message) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT)
  }
}
```

## 🔍 Performance Monitoring

### 1. Performance Metrics

```typescript
// Track performance metrics
const trackPerformance = (operation: string, startTime: number) => {
  const endTime = Date.now()
  const duration = endTime - startTime
  
  console.log(`${operation} took ${duration}ms`)
  
  // Send to analytics service
  analytics.track('performance', {
    operation,
    duration,
    timestamp: endTime
  })
}

// Usage
const startTime = Date.now()
await fetchTasks()
trackPerformance('fetchTasks', startTime)
```

### 2. Memory Usage Monitoring

```typescript
// Monitor memory usage (development only)
if (__DEV__) {
  setInterval(() => {
    const memoryUsage = performance.memory
    console.log('Memory usage:', {
      used: Math.round(memoryUsage.usedJSHeapSize / 1024 / 1024) + ' MB',
      total: Math.round(memoryUsage.totalJSHeapSize / 1024 / 1024) + ' MB',
      limit: Math.round(memoryUsage.jsHeapSizeLimit / 1024 / 1024) + ' MB'
    })
  }, 10000)
}
```

## ✅ Performance Checklist

### Code Performance
- [ ] Use React.memo for pure components
- [ ] Implement useCallback and useMemo appropriately
- [ ] Optimize FlatList with proper props
- [ ] Use lazy loading for heavy screens
- [ ] Implement efficient caching strategy

### Database Performance
- [ ] Optimize Supabase queries
- [ ] Implement pagination for large datasets
- [ ] Use proper indexes in database
- [ ] Cache frequently accessed data
- [ ] Minimize data transfer

### Bundle Performance
- [ ] Implement code splitting
- [ ] Use tree shaking
- [ ] Optimize images and assets
- [ ] Remove unused dependencies
- [ ] Minimize bundle size

### Runtime Performance
- [ ] Clean up subscriptions and timers
- [ ] Debounce expensive operations
- [ ] Monitor memory usage
- [ ] Optimize animations for 60fps
- [ ] Use platform-specific optimizations

The app is now optimized for peak performance! ⚡🚀
