# 🔗 Page Connection Verification Guide

## Purpose

This guide helps verify that all pages are properly connected to the database and working correctly.

---

## ✅ Connection Checklist Template

For each page, verify:

```
Page: [Page Name]
File: [File Path]
Database Tables: [Tables Used]
Status: [ ] Connected [ ] Tested [ ] Deployed

Queries:
- [ ] SELECT queries working
- [ ] INSERT queries working
- [ ] UPDATE queries working
- [ ] DELETE queries working

RLS Policies:
- [ ] SELECT policy verified
- [ ] INSERT policy verified
- [ ] UPDATE policy verified
- [ ] DELETE policy verified

Error Handling:
- [ ] Try-catch blocks added
- [ ] User feedback implemented
- [ ] Loading states added
- [ ] Empty states added

Testing:
- [ ] iOS tested
- [ ] Android tested
- [ ] Web tested
- [ ] Multi-user tested
```

---

## 📋 Page Connection Status

### Phase 1: Authentication
- [ ] Landing Page - Not Started
- [ ] Login Page - Not Started
- [ ] Signup Page - Not Started
- [ ] Forgot Password - Not Started

### Phase 2: Onboarding
- [ ] Intro Screen - Not Started
- [ ] Create/Join Household - Not Started
- [ ] Invite Members - Not Started
- [ ] Profile Setup - Not Started

### Phase 3: Dashboard
- [x] Dashboard - ✅ CONNECTED
  - Tables: tasks, bills, shopping_lists, proposals
  - Status: Working

### Phase 4: Tasks
- [ ] Task List - Not Started
- [ ] Task Details - Not Started
- [ ] Create Task - Not Started
- [ ] Edit Task - Not Started
- [ ] Random Assignment - Not Started
- [ ] Recurring Tasks - Not Started

### Phase 5: Approvals & Reviews
- [ ] Approvals List - Not Started
- [ ] Create Approval - Not Started
- [ ] Task Reviews - Not Started (NEW)
- [ ] Review Details - Not Started (NEW)

### Phase 6: Bills
- [ ] Bill List - Not Started
- [ ] Bill Details - Not Started
- [ ] Create Bill - Not Started
- [ ] Settle Up - Not Started
- [ ] Bill Analytics - Not Started
- [ ] Household Bills - Not Started

### Phase 7: Shopping
- [x] Shopping Lists - ✅ CONNECTED
  - Tables: shopping_lists, shopping_items
  - Status: Working
- [x] Shopping Detail - ✅ CONNECTED
  - Tables: shopping_lists, shopping_items
  - Status: Working
- [x] Create Shopping - ✅ CONNECTED
  - Tables: shopping_lists
  - Status: Working
- [ ] Shopping Analytics - Not Started

### Phase 8: Proposals
- [ ] Proposal List - Not Started
- [ ] Proposal Details - Not Started
- [ ] Create Proposal - Not Started

### Phase 9: Household
- [ ] Members - Not Started
- [ ] Activity Log - Not Started
- [ ] Settings - Not Started
- [ ] Transfer Requests - Not Started
- [ ] Household Bills - Not Started

### Phase 10: Settings
- [ ] Settings Home - Not Started
- [ ] Profile Settings - Not Started
- [ ] Notification Settings - Not Started

### Phase 11: Subscription
- [ ] Plans - Not Started
- [ ] Payment - Not Started

### Phase 12: Social
- [ ] Referrals - Not Started
- [ ] Achievements - Not Started
- [ ] Community - Not Started

### Phase 13: Support
- [ ] Help Center - Not Started
- [ ] Bug Report - Not Started

### Phase 14: Admin
- [ ] Analytics - Not Started

---

## 🔍 Connection Verification Steps

### Step 1: Check Imports
```typescript
// ✅ GOOD
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

// ❌ BAD
import supabase from 'supabase' // Wrong import
```

### Step 2: Verify Household Access
```typescript
// ✅ GOOD
const { data: householdData } = await supabase.rpc('get_default_household')
const householdId = householdData[0].household_id

// ❌ BAD
const householdId = 'hardcoded-id' // Never hardcode
```

### Step 3: Check Query Structure
```typescript
// ✅ GOOD
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('household_id', householdId)
  .order('due_date', { ascending: true })

if (error) throw error

// ❌ BAD
const data = await supabase.from('tasks').select('*') // No error handling
```

### Step 4: Verify Error Handling
```typescript
// ✅ GOOD
try {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('household_id', householdId)
  
  if (error) throw error
  setTasks(data)
} catch (error) {
  console.error('Error fetching tasks:', error)
  Alert.alert('Error', 'Failed to load tasks')
}

// ❌ BAD
const { data } = await supabase.from('tasks').select('*') // No error handling
setTasks(data)
```

### Step 5: Check Loading States
```typescript
// ✅ GOOD
const [loading, setLoading] = useState(true)

useEffect(() => {
  fetchTasks()
}, [])

const fetchTasks = async () => {
  setLoading(true)
  try {
    // ... fetch logic
  } finally {
    setLoading(false)
  }
}

// ❌ BAD
// No loading state management
```

### Step 6: Verify Empty States
```typescript
// ✅ GOOD
if (loading) return <LoadingSpinner />
if (!tasks || tasks.length === 0) return <EmptyState />
return <TaskList tasks={tasks} />

// ❌ BAD
return <TaskList tasks={tasks} /> // Crashes if tasks is empty
```

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] Query functions return correct data
- [ ] Error handling works
- [ ] Data validation works
- [ ] RLS policies enforced

### Integration Tests
- [ ] Page loads correctly
- [ ] Data displays properly
- [ ] User interactions work
- [ ] Navigation works

### E2E Tests
- [ ] Complete user flow works
- [ ] Multi-user scenarios work
- [ ] Error scenarios handled
- [ ] Performance acceptable

### Manual Tests
- [ ] iOS app works
- [ ] Android app works
- [ ] Web app works
- [ ] All features functional

---

## 🚀 Connection Deployment Checklist

Before deploying each page:

- [ ] All queries tested
- [ ] Error handling complete
- [ ] Loading states added
- [ ] Empty states added
- [ ] RLS policies verified
- [ ] Data isolation confirmed
- [ ] Performance optimized
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Tests passing

---

## 📊 Connection Status Summary

| Component | Status | Last Updated | Notes |
|-----------|--------|--------------|-------|
| Database Schema | ✅ Complete | 2025-10-27 | All tables created |
| RLS Policies | ✅ Complete | 2025-10-27 | All policies set |
| Dashboard | ✅ Connected | 2025-10-27 | Working |
| Shopping | ✅ Connected | 2025-10-27 | Working |
| Task Reviews | ⏳ Pending | 2025-10-27 | Awaiting deployment |
| Tasks | ⏳ Pending | - | Not started |
| Bills | ⏳ Pending | - | Not started |
| Proposals | ⏳ Pending | - | Not started |
| Household | ⏳ Pending | - | Not started |
| Settings | ⏳ Pending | - | Not started |
| Subscription | ⏳ Pending | - | Not started |
| Social | ⏳ Pending | - | Not started |
| Support | ⏳ Pending | - | Not started |
| Admin | ⏳ Pending | - | Not started |

---

## 🔧 Troubleshooting

### Issue: "Unable to resolve module"
**Solution**: Check import paths, verify file exists, check tsconfig.json

### Issue: "RLS policy violation"
**Solution**: Verify user is in household, check RLS policies, test with correct user

### Issue: "Data not loading"
**Solution**: Check network, verify query, check error logs, test RLS

### Issue: "Slow performance"
**Solution**: Add indexes, optimize queries, check network, profile code

### Issue: "Cross-household data visible"
**Solution**: Verify RLS policies, check household_id filtering, test isolation

---

## 📞 Support

For connection issues:
1. Check error logs in console
2. Verify RLS policies in Supabase
3. Test query in Supabase SQL editor
4. Check network tab in DevTools
5. Review database connection guide

---

**Last Updated**: 2025-10-27  
**Total Pages**: 48  
**Connected Pages**: 3  
**Pending Pages**: 45  
**Completion**: 6%  

