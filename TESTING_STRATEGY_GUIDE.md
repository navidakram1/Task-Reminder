# 🧪 Comprehensive Testing Strategy Guide

## Overview

This guide outlines a complete testing strategy for the SplitDuty app, covering unit tests, integration tests, end-to-end tests, and manual testing procedures.

## 🔧 Testing Setup

### Dependencies Installation

```bash
# Core testing dependencies
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native

# Additional testing utilities
npm install --save-dev react-test-renderer jest-expo
npm install --save-dev @testing-library/user-event

# Mocking utilities
npm install --save-dev jest-fetch-mock
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/jest.setup.js'
  ],
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
}
```

### Test Setup File

```javascript
// jest.setup.js
import 'react-native-gesture-handler/jestSetup'
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage)

// Mock Supabase
jest.mock('./lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => Promise.resolve({ data: null, error: null })),
      delete: jest.fn(() => Promise.resolve({ data: null, error: null }))
    })),
    auth: {
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn()
    }
  }
}))

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn()
  }),
  useRoute: () => ({
    params: {}
  })
}))

// Mock Expo Router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn()
  },
  useLocalSearchParams: () => ({}),
  useGlobalSearchParams: () => ({})
}))
```

## 🧩 Unit Testing

### Component Testing

```typescript
// __tests__/components/TaskCard.test.tsx
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import TaskCard from '../components/TaskCard'

describe('TaskCard', () => {
  const mockTask = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'pending',
    due_date: '2024-01-15',
    emoji: '📋'
  }

  it('renders task information correctly', () => {
    const { getByText } = render(
      <TaskCard task={mockTask} onPress={jest.fn()} />
    )

    expect(getByText('Test Task')).toBeTruthy()
    expect(getByText('Test Description')).toBeTruthy()
    expect(getByText('📋')).toBeTruthy()
  })

  it('calls onPress when tapped', () => {
    const mockOnPress = jest.fn()
    const { getByTestId } = render(
      <TaskCard task={mockTask} onPress={mockOnPress} testID="task-card" />
    )

    fireEvent.press(getByTestId('task-card'))
    expect(mockOnPress).toHaveBeenCalledWith(mockTask.id)
  })

  it('displays correct status badge', () => {
    const { getByText } = render(
      <TaskCard task={mockTask} onPress={jest.fn()} />
    )

    expect(getByText('pending')).toBeTruthy()
  })
})
```

### Service Testing

```typescript
// __tests__/lib/subscriptionService.test.ts
import { SubscriptionService } from '../lib/subscriptionService'
import { supabase } from '../lib/supabase'

jest.mock('../lib/supabase')

describe('SubscriptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getSubscriptionStatus', () => {
    it('returns free tier when no subscription exists', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: new Error('No subscription') })
              })
            })
          })
        })
      })

      const status = await SubscriptionService.getSubscriptionStatus('user-id')
      
      expect(status.plan).toBe('free')
      expect(status.status).toBe('active')
      expect(status.features).toContain('basic_tasks')
    })

    it('returns premium status for active subscription', async () => {
      const mockSubscription = {
        plan: 'monthly',
        status: 'active',
        current_period_end: '2024-02-15'
      }

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockSubscription, error: null })
              })
            })
          })
        })
      })

      const status = await SubscriptionService.getSubscriptionStatus('user-id')
      
      expect(status.plan).toBe('monthly')
      expect(status.status).toBe('active')
      expect(status.features).toContain('unlimited_tasks')
    })
  })

  describe('checkTaskLimit', () => {
    it('allows unlimited tasks for premium users', async () => {
      jest.spyOn(SubscriptionService, 'getSubscriptionStatus').mockResolvedValue({
        plan: 'monthly',
        status: 'active',
        features: ['unlimited_tasks']
      })

      const limit = await SubscriptionService.checkTaskLimit('user-id')
      
      expect(limit.allowed).toBe(true)
      expect(limit.limit).toBe(-1)
    })

    it('enforces task limits for free users', async () => {
      jest.spyOn(SubscriptionService, 'getSubscriptionStatus').mockResolvedValue({
        plan: 'free',
        status: 'active',
        features: ['basic_tasks']
      })

      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({ count: 5, error: null })
          })
        })
      })

      const limit = await SubscriptionService.checkTaskLimit('user-id')
      
      expect(limit.allowed).toBe(true)
      expect(limit.current).toBe(5)
      expect(limit.limit).toBe(10)
    })
  })
})
```

### Hook Testing

```typescript
// __tests__/hooks/useAuth.test.ts
import { renderHook, act } from '@testing-library/react-native'
import { useAuth } from '../contexts/AuthContext'

describe('useAuth', () => {
  it('initializes with null user', () => {
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(true)
  })

  it('handles sign in correctly', async () => {
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      await result.current.signIn('test@example.com', 'password')
    })
    
    expect(result.current.user).toBeTruthy()
    expect(result.current.loading).toBe(false)
  })
})
```

## 🔗 Integration Testing

### Screen Integration Tests

```typescript
// __tests__/integration/TaskListScreen.test.tsx
import React from 'react'
import { render, waitFor, fireEvent } from '@testing-library/react-native'
import TaskListScreen from '../app/(app)/tasks/index'
import { AuthProvider } from '../contexts/AuthContext'

const renderWithProviders = (component) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  )
}

describe('TaskListScreen Integration', () => {
  it('loads and displays tasks', async () => {
    const mockTasks = [
      { id: '1', title: 'Task 1', status: 'pending' },
      { id: '2', title: 'Task 2', status: 'completed' }
    ]

    ;(supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: mockTasks, error: null })
    })

    const { getByText } = renderWithProviders(<TaskListScreen />)

    await waitFor(() => {
      expect(getByText('Task 1')).toBeTruthy()
      expect(getByText('Task 2')).toBeTruthy()
    })
  })

  it('handles task creation flow', async () => {
    const { getByTestId } = renderWithProviders(<TaskListScreen />)

    fireEvent.press(getByTestId('add-task-button'))

    // Verify navigation to create task screen
    expect(mockNavigate).toHaveBeenCalledWith('create')
  })
})
```

### API Integration Tests

```typescript
// __tests__/integration/api.test.ts
import { taskService } from '../lib/taskService'

describe('Task API Integration', () => {
  it('creates task successfully', async () => {
    const taskData = {
      title: 'Test Task',
      description: 'Test Description',
      household_id: 'household-1'
    }

    const result = await taskService.createTask(taskData)
    
    expect(result.success).toBe(true)
    expect(result.data.title).toBe('Test Task')
  })

  it('handles API errors gracefully', async () => {
    ;(supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      })
    })

    const result = await taskService.createTask({})
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Database error')
  })
})
```

## 🎭 End-to-End Testing

### E2E Test Setup with Detox

```bash
# Install Detox
npm install --save-dev detox

# iOS setup
npx detox build --configuration ios.sim.debug
npx detox test --configuration ios.sim.debug

# Android setup
npx detox build --configuration android.emu.debug
npx detox test --configuration android.emu.debug
```

### E2E Test Examples

```typescript
// e2e/taskFlow.e2e.js
describe('Task Management Flow', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  beforeEach(async () => {
    await device.reloadReactNative()
  })

  it('should create a new task', async () => {
    // Navigate to tasks screen
    await element(by.id('tasks-tab')).tap()
    
    // Tap add task button
    await element(by.id('add-task-button')).tap()
    
    // Fill task form
    await element(by.id('task-title-input')).typeText('Test Task')
    await element(by.id('task-description-input')).typeText('Test Description')
    
    // Save task
    await element(by.id('save-task-button')).tap()
    
    // Verify task appears in list
    await expect(element(by.text('Test Task'))).toBeVisible()
  })

  it('should complete a task', async () => {
    // Find and tap on a task
    await element(by.text('Test Task')).tap()
    
    // Mark as complete
    await element(by.id('complete-task-button')).tap()
    
    // Verify status change
    await expect(element(by.text('completed'))).toBeVisible()
  })
})
```

## 📱 Manual Testing

### Testing Checklist

#### Authentication Flow
- [ ] Sign up with email
- [ ] Sign up with phone
- [ ] Sign in with existing account
- [ ] Password reset flow
- [ ] Social login (Google/Apple)
- [ ] Account verification

#### Core Features
- [ ] Create household
- [ ] Join household via invite code
- [ ] Create tasks with all options
- [ ] Assign tasks to members
- [ ] Complete tasks
- [ ] Task approval flow
- [ ] Create bills
- [ ] Split bills equally/custom
- [ ] Upload receipts
- [ ] Settle bills

#### Edge Cases
- [ ] Offline functionality
- [ ] Poor network conditions
- [ ] App backgrounding/foregrounding
- [ ] Memory pressure scenarios
- [ ] Large datasets
- [ ] Concurrent user actions

#### Platform-Specific
- [ ] iOS-specific features
- [ ] Android-specific features
- [ ] Different screen sizes
- [ ] Accessibility features
- [ ] Dark mode support

### Performance Testing

```typescript
// Performance test utilities
const measurePerformance = async (operation: string, fn: Function) => {
  const start = Date.now()
  await fn()
  const end = Date.now()
  
  console.log(`${operation} took ${end - start}ms`)
  
  // Assert performance thresholds
  expect(end - start).toBeLessThan(1000) // Should complete within 1 second
}

describe('Performance Tests', () => {
  it('loads task list quickly', async () => {
    await measurePerformance('Task List Load', async () => {
      const { getByTestId } = render(<TaskListScreen />)
      await waitFor(() => getByTestId('task-list'))
    })
  })
})
```

## 🔍 Test Coverage

### Coverage Reports

```bash
# Generate coverage report
npm test -- --coverage

# View coverage in browser
npm test -- --coverage --watchAll=false
open coverage/lcov-report/index.html
```

### Coverage Goals

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

### Critical Path Coverage

Ensure 100% coverage for:
- Authentication flows
- Payment processing
- Data synchronization
- Security-related functions

## 🚀 Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test -- --coverage --watchAll=false
      
    - name: Upload coverage
      uses: codecov/codecov-action@v1
```

## ✅ Testing Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests independent and isolated

### Mocking Strategy
- Mock external dependencies
- Use real implementations for internal logic
- Mock time-dependent functions
- Avoid over-mocking

### Test Data Management
- Use factories for test data
- Keep test data minimal and focused
- Clean up after tests
- Use realistic but safe test data

The comprehensive testing strategy ensures a robust, reliable app! 🧪✅
