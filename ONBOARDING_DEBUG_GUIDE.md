# 🔍 Onboarding Debug Guide

## Issue: Onboarding Not Showing

If the onboarding screens are not appearing, follow these steps:

---

## 🎯 Quick Fix

### **Step 1: Check the Loading Screen**

When you open the app, you should see:
- Loading spinner
- Debug text showing: `Loading... (user: no, onboarding: yes/no)`
- **"Reset Onboarding" button**

### **Step 2: Click "Reset Onboarding" Button**

This will:
- ✅ Clear the `onboarding_complete` flag from AsyncStorage
- ✅ Force the app to show the onboarding screens
- ✅ Redirect to `/(onboarding)/intro`

### **Step 3: Verify Onboarding Shows**

After clicking the button, you should see:
1. **Intro Screen** - SplitDuty logo and welcome message
2. **Features Screen** - Smart task assignment, bill splitting, etc.
3. **Welcome Screen** - Create/Join household
4. **Create/Join Household** - Household setup
5. **Invite Members** - Add family/roommates
6. **Profile Setup** - User profile configuration

---

## 🔧 How It Works

### **Routing Logic**

```
app/index.tsx (Root)
  ↓
Check: Is user logged in?
  ├─ YES → Go to /(app)/dashboard
  ├─ NO → Check: Has user seen onboarding?
  │   ├─ YES → Go to /(auth)/landing
  │   └─ NO → Go to /(onboarding)/intro
```

### **AsyncStorage Flag**

- **Key:** `onboarding_complete`
- **Value:** `'true'` or `'false'`
- **Set when:** User completes onboarding
- **Checked on:** App startup

---

## 🐛 Troubleshooting

### **Problem: Still Not Showing Onboarding**

**Solution 1: Clear AsyncStorage Completely**
```bash
# In browser console (web):
localStorage.clear()

# Then refresh the page
```

**Solution 2: Check Console Logs**
- Open browser DevTools (F12)
- Look for: `Onboarding complete flag: ...`
- Should show `null` or `false` for new users

**Solution 3: Verify Routing**
- Check that `/(onboarding)/intro` exists
- Verify `app/(onboarding)/_layout.tsx` includes all screens
- Check that `intro.tsx` routes to `features.tsx`

---

## 📱 Testing Onboarding Flow

### **Test 1: First Time User**
1. Clear AsyncStorage
2. Restart app
3. Should see intro screen

### **Test 2: Returning User**
1. Complete onboarding
2. Restart app
3. Should go to landing page (not onboarding)

### **Test 3: Logged In User**
1. Sign up/login
2. Restart app
3. Should go to dashboard (not onboarding)

---

## 📋 Onboarding Screens

### **Screen 1: Intro**
- File: `app/(onboarding)/intro.tsx`
- Shows: SplitDuty logo, welcome message
- Next: Features screen

### **Screen 2: Features**
- File: `app/(onboarding)/features.tsx`
- Shows: Smart task assignment, bill splitting, approvals
- Next: Welcome screen

### **Screen 3: Welcome**
- File: `app/(onboarding)/welcome.tsx`
- Shows: Create/Join household options
- Next: Create/Join household

### **Screen 4: Create/Join Household**
- File: `app/(onboarding)/create-join-household.tsx`
- Shows: Household setup form
- Next: Invite members

### **Screen 5: Invite Members**
- File: `app/(onboarding)/invite-members.tsx`
- Shows: Add family/roommates
- Next: Profile setup

### **Screen 6: Profile Setup**
- File: `app/(onboarding)/profile-setup.tsx`
- Shows: User profile configuration
- Next: Sets `onboarding_complete = 'true'` and goes to landing

---

## ✅ Status Check

**Current Status:**
- ✅ All onboarding screens created
- ✅ Routing logic implemented
- ✅ AsyncStorage flag system working
- ✅ Debug button added for testing
- ✅ Expo server running

---

## 🚀 Next Steps

1. **Test the app** - Click "Reset Onboarding" button
2. **Navigate through screens** - Verify all 6 screens work
3. **Check console logs** - Look for routing messages
4. **Complete onboarding** - Verify it sets the flag correctly

---

## 💡 Tips

- **Debug Mode:** The loading screen shows current state
- **Reset Button:** Always available on loading screen
- **Console Logs:** Check browser console for routing info
- **AsyncStorage:** Persists across app restarts


