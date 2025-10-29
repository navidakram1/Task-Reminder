# Household Messaging - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Create Database Tables (2 minutes)
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy & paste `HOUSEHOLD_MESSAGES_SCHEMA.sql`
4. Click "Run"
5. Wait for success message

### Step 2: Verify Files (1 minute)
Check these files exist:
- ✅ `app/(app)/messages.tsx` - Messages screen
- ✅ `lib/messageService.ts` - Message utilities
- ✅ `app/(app)/dashboard.tsx` - Updated with message icon

### Step 3: Test in App (2 minutes)
1. Reload your Expo app (press 'r')
2. Look for 💬 icon in dashboard header
3. Tap the icon to open messages
4. Send a test message
5. Verify it appears in real-time

---

## 🎯 What You Get

### Messages Screen
```
┌─────────────────────────────────┐
│ Household Chat                  │
├─────────────────────────────────┤
│ Messages | Activities | Notes   │
├─────────────────────────────────┤
│ [Avatar] John        2:30 PM    │
│          Hey everyone!          │
│                                 │
│ [Avatar] Sarah       2:31 PM    │
│          Hi! How's it going?    │
├─────────────────────────────────┤
│ [Input field] [Send]            │
└─────────────────────────────────┘
```

### Dashboard Header
```
┌─────────────────────────────────┐
│ 🏠 SplitDuty  💬(3) ⭐ 👤       │
│    Household Manager            │
├─────────────────────────────────┤
│ ☀️ Good morning, John!          │
│    Mon, Oct 28                  │
└─────────────────────────────────┘
```

---

## 📝 Usage Examples

### Send a Message
```typescript
import { MessageService } from '@/lib/messageService'

// Send message
await MessageService.sendMessage(householdId, 'Hello everyone!')

// Send note
await MessageService.sendMessage(householdId, 'Remember to buy milk', 'note')
```

### Get Messages
```typescript
// Fetch messages
const { data: messages } = await MessageService.getMessages(householdId)

// Fetch activities
const { data: activities } = await MessageService.getActivities(householdId)

// Fetch notes
const { data: notes } = await MessageService.getNotes(householdId)
```

### Real-time Updates
```typescript
// Subscribe to message changes
const subscription = MessageService.subscribeToMessages(householdId, () => {
  // Refresh messages when new message arrives
  fetchMessages()
})

// Cleanup
subscription.unsubscribe()
```

### Unread Count
```typescript
// Get unread count
const { count } = await MessageService.getUnreadCount(householdId)

// Mark as read
await MessageService.markAsRead(messageId)
```

---

## 🎨 UI Features

### Three Tabs
1. **Messages** - Chat messages
2. **Activities** - Household activity log
3. **Notes** - Shared notes

### Message Display
- User avatar (40x40px)
- User name
- Message timestamp
- Message content
- Edit indicator if edited

### Input Area
- Text input with placeholder
- Send button (disabled if empty)
- Loading state while sending
- Success animation on send

### Dashboard Integration
- 💬 Message icon in header
- Red badge with unread count
- Shows "9+" if count > 9
- Tap to open messages

---

## 🔄 Real-time Features

### Auto-refresh
- Messages refresh when new message sent
- Activities refresh when activity logged
- Unread count updates in real-time
- No manual refresh needed

### Subscriptions
- Automatic connection to Supabase
- Listens for INSERT, UPDATE, DELETE
- Triggers callback on changes
- Handles disconnections gracefully

---

## 🎯 Key Components

### Messages Screen
```typescript
// Location: app/(app)/messages.tsx
// Features:
// - Three tabs (Messages, Activities, Notes)
// - Real-time message list
// - Message input with send
// - User avatars
// - Timestamps
// - Success animation
```

### Message Service
```typescript
// Location: lib/messageService.ts
// Methods:
// - sendMessage()
// - getMessages()
// - getActivities()
// - getNotes()
// - getUnreadCount()
// - markAsRead()
// - addReaction()
// - editMessage()
// - deleteMessage()
// - pinMessage()
// - subscribeToMessages()
// - subscribeToActivities()
```

### Dashboard Integration
```typescript
// Location: app/(app)/dashboard.tsx
// Added:
// - Message icon in header
// - Unread count badge
// - Navigation to messages
// - Real-time badge updates
```

---

## 🧪 Testing

### Test Sending Message
1. Open messages screen
2. Type "Hello"
3. Tap Send
4. Verify message appears
5. Check success animation

### Test Real-time
1. Open messages on two devices
2. Send message on device 1
3. Verify appears on device 2 instantly
4. No refresh needed

### Test Unread Count
1. Send message from another user
2. Check badge in header
3. Verify count increases
4. Open messages to mark as read
5. Verify count decreases

### Test Tabs
1. Click Messages tab
2. Click Activities tab
3. Click Notes tab
4. Verify content changes
5. Verify input shows/hides

---

## 🐛 Common Issues

### Messages not appearing
**Solution**: Check RLS policies in Supabase
```sql
-- Verify policies exist
SELECT * FROM pg_policies WHERE tablename = 'household_messages';
```

### Unread count not updating
**Solution**: Verify function exists
```sql
-- Check function
SELECT * FROM pg_proc WHERE proname = 'get_unread_message_count';
```

### Real-time not working
**Solution**: Check Supabase real-time is enabled
- Go to Supabase Dashboard
- Check Realtime is enabled for tables
- Verify network connection

### Avatar not showing
**Solution**: Check user profile
```sql
-- Verify profile has photo_url
SELECT id, name, photo_url FROM profiles LIMIT 1;
```

---

## 📊 Database Queries

### View All Messages
```sql
SELECT * FROM household_messages_with_users 
WHERE household_id = 'your-household-id'
ORDER BY created_at DESC;
```

### View Unread Count
```sql
SELECT COUNT(*) FROM household_messages hm
LEFT JOIN message_read_status mrs ON hm.id = mrs.message_id
WHERE hm.household_id = 'your-household-id'
AND mrs.id IS NULL;
```

### View Activities
```sql
SELECT * FROM household_activities_with_users
WHERE household_id = 'your-household-id'
ORDER BY created_at DESC;
```

---

## ✅ Checklist

- [ ] Database schema created
- [ ] Messages screen working
- [ ] Can send messages
- [ ] Real-time updates working
- [ ] Message icon in header
- [ ] Unread badge showing
- [ ] Activities displaying
- [ ] Notes working
- [ ] Avatars showing
- [ ] Timestamps correct

---

## 🚀 Next Steps

1. **Test thoroughly** - Send messages, verify real-time
2. **Add activity logging** - Log household events
3. **Implement reactions** - Add emoji reactions
4. **Add search** - Search messages
5. **Add pinned messages** - Pin important messages
6. **Add message editing** - Edit sent messages
7. **Add notifications** - Push notifications for messages
8. **Add message threads** - Reply to specific messages

---

## 📞 Need Help?

1. Check `MESSAGING_FEATURE_GUIDE.md` for detailed docs
2. Review `app/(app)/messages.tsx` for implementation
3. Check `lib/messageService.ts` for API
4. Verify database schema in Supabase
5. Check browser console for errors

---

## ✨ Features Summary

✅ Real-time household chat
✅ Activity feed
✅ Shared notes
✅ User avatars
✅ Unread count badge
✅ Message timestamps
✅ Edit indicators
✅ Success animations
✅ Three tabs
✅ Smooth transitions

**Status**: Ready to use! 🎉

