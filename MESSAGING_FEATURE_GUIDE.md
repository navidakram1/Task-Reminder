# Household Messaging Feature - Implementation Guide

## 🎯 Overview

A complete household messaging system similar to Flatastic with:
- **Messages Tab**: Real-time household chat
- **Activities Tab**: Household activity feed
- **Notes Tab**: Shared household notes
- **Message Icon**: In dashboard header with unread count badge
- **Real-time Updates**: Live message synchronization
- **Smooth Animations**: Send feedback and transitions

---

## 📁 Files Created/Modified

### New Files
1. **`HOUSEHOLD_MESSAGES_SCHEMA.sql`** - Database schema
2. **`app/(app)/messages.tsx`** - Main messages screen
3. **`lib/messageService.ts`** - Message service utilities

### Modified Files
1. **`app/(app)/dashboard.tsx`** - Added message icon to header

---

## 🗄️ Database Schema

### Tables Created

#### `household_messages`
```sql
- id (UUID, PK)
- household_id (FK to households)
- user_id (FK to auth.users)
- message_type ('message' | 'activity' | 'note')
- content (TEXT)
- is_pinned (BOOLEAN)
- is_edited (BOOLEAN)
- edited_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `message_reactions`
```sql
- id (UUID, PK)
- message_id (FK to household_messages)
- user_id (FK to auth.users)
- reaction_emoji (VARCHAR)
- created_at (TIMESTAMP)
```

#### `message_read_status`
```sql
- id (UUID, PK)
- message_id (FK to household_messages)
- user_id (FK to auth.users)
- read_at (TIMESTAMP)
```

#### `household_activities`
```sql
- id (UUID, PK)
- household_id (FK to households)
- user_id (FK to auth.users)
- activity_type (VARCHAR)
- activity_description (TEXT)
- related_entity_type (VARCHAR)
- related_entity_id (UUID)
- created_at (TIMESTAMP)
```

### Views Created
- `household_messages_with_users` - Messages with user info
- `household_activities_with_users` - Activities with user info
- `unread_messages_count` - Unread count per household

### Functions Created
- `send_household_message()` - Send a message
- `get_unread_message_count()` - Get unread count

---

## 🚀 Setup Instructions

### Step 1: Run Database Schema
1. Go to Supabase Dashboard
2. Open SQL Editor
3. Copy entire content of `HOUSEHOLD_MESSAGES_SCHEMA.sql`
4. Run the SQL script
5. Verify tables are created

### Step 2: Update Navigation
Add messages route to your navigation stack:

```typescript
// In your navigation configuration
{
  name: 'messages',
  component: MessagesScreen,
  options: {
    title: 'Messages',
    tabBarIcon: ({ color }) => <Text>💬</Text>,
  }
}
```

### Step 3: Update Dashboard
The message icon is already added to the dashboard header with:
- 💬 Message icon
- Red badge showing unread count
- Navigation to messages screen

---

## 📱 UI Components

### Messages Screen (`app/(app)/messages.tsx`)

**Features:**
- Three tabs: Messages, Activities, Notes
- Real-time message list
- Message input with send button
- User avatars with fallback
- Timestamp display
- Edit indicator for edited messages
- Success animation on send

**Tabs:**
1. **Messages** - Regular household chat
2. **Activities** - Activity feed (read-only)
3. **Notes** - Shared notes

**Message Item Layout:**
```
┌─────────────────────────────────────┐
│ [Avatar] Name              Time      │
│          Message content...          │
│          (edited)                    │
└─────────────────────────────────────┘
```

### Dashboard Header Update

**Message Icon:**
- Position: Top right of header
- Icon: 💬 (chat bubble)
- Badge: Red circle with unread count
- Tap: Navigate to messages screen

**Badge Styling:**
- Size: 20x20px
- Background: #FF6B6B (Coral Red)
- Text: White, bold
- Shows "9+" if count > 9

---

## 🔧 Message Service API

### `MessageService` Class

```typescript
// Send a message
await MessageService.sendMessage(householdId, content, 'message')

// Get messages
const { data: messages } = await MessageService.getMessages(householdId)

// Get activities
const { data: activities } = await MessageService.getActivities(householdId)

// Get notes
const { data: notes } = await MessageService.getNotes(householdId)

// Get unread count
const { count } = await MessageService.getUnreadCount(householdId)

// Mark as read
await MessageService.markAsRead(messageId)

// Add reaction
await MessageService.addReaction(messageId, '❤️')

// Edit message
await MessageService.editMessage(messageId, newContent)

// Delete message
await MessageService.deleteMessage(messageId)

// Pin message
await MessageService.pinMessage(messageId)

// Subscribe to updates
const subscription = MessageService.subscribeToMessages(householdId, callback)
```

---

## 🎨 Styling & Colors

### Color Scheme
- **Primary**: #FF6B6B (Coral Red)
- **Background**: #fff (White)
- **Secondary**: #f5f5f5 (Light Gray)
- **Text Primary**: #1a1a1a (Dark)
- **Text Secondary**: #666 (Gray)
- **Border**: #f0f0f0 (Light Border)

### Component Sizes
- **Avatar**: 40x40px (messages), 32x32px (activities)
- **Tab**: 12px padding, 20px border radius
- **Input**: 20px border radius, 16px padding
- **Badge**: 20x20px, 10px border radius

---

## 🔄 Real-time Updates

### Subscriptions
The messaging system uses Supabase real-time subscriptions:

```typescript
// Subscribe to message changes
const subscription = supabase
  .channel(`messages:${householdId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'household_messages',
    filter: `household_id=eq.${householdId}`
  }, () => {
    // Refresh messages
  })
  .subscribe()
```

### Auto-refresh
- Messages refresh on new message insert
- Activities refresh on new activity insert
- Unread count updates in real-time

---

## ✨ Features

### Messages Tab
- ✅ Send messages
- ✅ View message history
- ✅ User avatars
- ✅ Timestamps
- ✅ Edit indicator
- ✅ Real-time updates

### Activities Tab
- ✅ View household activities
- ✅ Activity descriptions
- ✅ User info
- ✅ Timestamps
- ✅ Read-only (no input)

### Notes Tab
- ✅ Send notes
- ✅ View note history
- ✅ Same as messages but for notes

### Dashboard Integration
- ✅ Message icon in header
- ✅ Unread count badge
- ✅ Navigation to messages
- ✅ Real-time badge updates

---

## 🧪 Testing Checklist

- [ ] Database schema created successfully
- [ ] Messages can be sent
- [ ] Messages appear in real-time
- [ ] Activities display correctly
- [ ] Notes can be sent and viewed
- [ ] Unread count updates
- [ ] Message icon shows in header
- [ ] Badge displays unread count
- [ ] Tap message icon navigates to messages
- [ ] Avatars display correctly
- [ ] Timestamps format correctly
- [ ] Success animation shows on send
- [ ] Tab switching works smoothly
- [ ] Input clears after send
- [ ] Edited messages show indicator

---

## 🐛 Troubleshooting

### Messages not appearing
- Check RLS policies are enabled
- Verify user is in household
- Check household_id is correct

### Unread count not updating
- Verify `get_unread_message_count()` function exists
- Check message_read_status table
- Ensure subscription is active

### Avatar not showing
- Check user has photo_url in profiles table
- Verify Supabase storage permissions
- Check image URL is valid

### Real-time not working
- Verify Supabase real-time is enabled
- Check network connection
- Restart app

---

## 📊 Performance Considerations

- Messages limited to 50 per query (configurable)
- Indexes on household_id, user_id, created_at
- Real-time subscriptions use channels
- Lazy loading for message history

---

## 🔐 Security

### Row Level Security (RLS)
- ✅ Users can only view messages in their households
- ✅ Users can only send messages to their households
- ✅ Users can only edit/delete their own messages
- ✅ Activities are household-scoped

### Authentication
- ✅ All operations require auth.uid()
- ✅ Household membership verified
- ✅ User ID validated on insert

---

## 🚀 Next Steps

1. **Run Database Schema** - Execute SQL in Supabase
2. **Test Messages** - Send test messages
3. **Verify Real-time** - Check live updates
4. **Add Activity Logging** - Log household activities
5. **Implement Reactions** - Add emoji reactions
6. **Add Search** - Search messages
7. **Add Pinned Messages** - Pin important messages
8. **Add Message Editing** - Edit sent messages

---

## 📞 Support

For issues or questions:
1. Check database schema is created
2. Verify RLS policies are enabled
3. Check network connection
4. Review error logs in console
5. Test with Supabase dashboard

---

## ✅ Status

**Implementation**: COMPLETE ✅
- Database schema created
- Messages screen implemented
- Dashboard integration done
- Message service utilities ready
- Real-time subscriptions configured

**Ready for**: Testing and deployment

