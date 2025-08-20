# Dashboard Testing Guide

This directory contains comprehensive tests for the SplitDuty Dashboard feature, ensuring all components work correctly across different scenarios and platforms.

## Test Structure

### Core Dashboard Tests (`dashboard.test.tsx`)
- **Loading States**: Verifies loading indicators and transitions
- **No Household State**: Tests welcome screen and household creation flow
- **Dashboard with Data**: Tests main dashboard functionality with mock data
- **Multi-Household Switcher**: Tests household switching modal and functionality
- **Empty States**: Verifies empty state displays for tasks, bills, and activity
- **Accessibility**: Tests screen reader compatibility and accessibility labels
- **Cross-Platform Compatibility**: Tests iOS and Android specific behaviors

### Analytics Widget Tests (`dashboard-analytics.test.tsx`)
- **Analytics Cards Display**: Tests all four analytics widgets (Tasks Completed, Total Spent, Avg Tasks/Week, Efficiency)
- **Analytics Card Styling**: Verifies proper styling and grid layout
- **Analytics Data Calculation**: Tests data calculation logic and error handling
- **Analytics Responsiveness**: Tests adaptation to different screen sizes
- **Analytics Accessibility**: Tests accessibility features for analytics widgets
- **Analytics Performance**: Tests loading efficiency and concurrent requests

### Activity Feed Tests (`dashboard-activity-feed.test.tsx`)
- **Activity Feed Display**: Tests activity feed section and item display
- **Activity Feed Navigation**: Tests navigation to full activity page
- **Activity Feed Empty State**: Tests empty state when no activities exist
- **Activity Feed Error Handling**: Tests error scenarios and malformed data
- **Activity Feed Formatting**: Tests timestamp formatting and activity types
- **Activity Feed Performance**: Tests loading efficiency with large datasets
- **Activity Feed Accessibility**: Tests accessibility features

## Test Features Covered

### 🏠 Household Overview Cards
- [x] Household name and status display
- [x] Active household indicator
- [x] Household statistics (tasks, bills, transfers)
- [x] Household switcher dropdown functionality
- [x] Multi-household support

### 👋 Personal Welcome Message
- [x] Time-based greeting (morning/afternoon/evening)
- [x] User name display from metadata
- [x] Task count summary
- [x] Current date display
- [x] Motivational messaging

### ⚡ Quick Action Buttons
- [x] Create Task navigation
- [x] SplitDuty AI navigation
- [x] Add Bill navigation
- [x] View Bills navigation
- [x] Transfers navigation
- [x] Members navigation
- [x] Proper button styling and icons

### 📊 Analytics Widgets
- [x] Tasks Completed (monthly count)
- [x] Total Spent (monthly spending)
- [x] Average Tasks per Week (4-week average)
- [x] Household Efficiency (completion rate percentage)
- [x] Responsive grid layout
- [x] Error handling for missing data

### 🔔 Activity Feed
- [x] Recent activity display (last 5 items)
- [x] Activity type icons (task, bill, etc.)
- [x] User attribution
- [x] Timestamp formatting
- [x] "See All" navigation
- [x] Empty state handling

### 📋 Upcoming Tasks Summary
- [x] Task list display
- [x] Task status indicators
- [x] Due date formatting
- [x] Task navigation
- [x] Empty state with creation prompt

### 💰 Recent Bills Display
- [x] Bill list display
- [x] Amount formatting
- [x] Category display
- [x] Date formatting
- [x] Bill navigation
- [x] Empty state with creation prompt

### 🔄 Transfer Requests
- [x] Pending transfer display
- [x] Transfer request details
- [x] Navigation to transfer management
- [x] Conditional display (only when transfers exist)

## Running Tests

### Run All Dashboard Tests
```bash
npm run test:dashboard
```

### Run Analytics Tests Only
```bash
npm run test:analytics
```

### Run Activity Feed Tests Only
```bash
npm run test:activity
```

### Run All Tests with Coverage
```bash
npm run test:coverage
```

### Watch Mode for Development
```bash
npm run test:watch
```

## Test Configuration

### Setup (`setup.ts`)
- Mocks all external dependencies (Expo, Supabase, React Native modules)
- Provides global test utilities and mock data
- Configures test environment for React Native testing

### Jest Configuration (`jest.config.js`)
- Uses `jest-expo` preset for Expo compatibility
- Configures coverage reporting
- Sets up module name mapping
- Configures transform patterns for React Native

## Mock Data Structure

### User Mock
```typescript
{
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    name: 'Test User',
    full_name: 'Test User',
  },
}
```

### Household Mock
```typescript
{
  id: 'household-1',
  name: 'Test Household',
  invite_code: 'ABC123',
  userRole: 'admin',
}
```

### Task Mock
```typescript
{
  id: 'task-1',
  title: 'Test Task',
  description: 'Test task description',
  due_date: '2024-01-15',
  status: 'pending',
  household_id: 'household-1',
}
```

## Accessibility Testing

All tests include accessibility checks for:
- Screen reader compatibility
- Proper accessibility labels
- Keyboard navigation support
- Color contrast compliance
- Touch target sizes

## Cross-Platform Testing

Tests verify compatibility across:
- iOS devices (iPhone, iPad)
- Android devices (phone, tablet)
- Web browsers
- Different screen sizes and orientations

## Performance Testing

Performance tests ensure:
- Dashboard loads within 5 seconds
- Analytics widgets load within 3 seconds
- Activity feed handles large datasets efficiently
- Concurrent requests don't cause issues
- Memory usage remains reasonable

## Error Handling Testing

Tests cover error scenarios including:
- Network failures
- Database errors
- Malformed data responses
- Missing user permissions
- Invalid household access

## Best Practices

1. **Test Isolation**: Each test is independent and doesn't rely on others
2. **Mock Consistency**: All mocks use consistent data structures
3. **Async Handling**: Proper use of `waitFor` for async operations
4. **Error Boundaries**: Tests include error boundary scenarios
5. **Real User Scenarios**: Tests simulate actual user interactions

## Contributing

When adding new dashboard features:

1. Add corresponding tests in the appropriate test file
2. Update mock data if new data structures are introduced
3. Ensure accessibility tests are included
4. Test both success and error scenarios
5. Update this README with new test coverage

## Coverage Goals

- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

Current coverage can be viewed by running:
```bash
npm run test:coverage
```
