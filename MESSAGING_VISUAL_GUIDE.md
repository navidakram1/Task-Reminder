# Household Messaging - Visual Implementation Guide

## 📱 Screen Layouts

### Messages Screen - Messages Tab
```
┌─────────────────────────────────────────┐
│ Household Chat                          │
├─────────────────────────────────────────┤
│ [Messages] [Activities] [Notes]         │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [Avatar] John          2:30 PM      │ │
│ │          Hey everyone! How's it     │ │
│ │          going?                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [Avatar] Sarah         2:31 PM      │ │
│ │          Hi! All good here!         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [Avatar] Mike          2:32 PM      │ │
│ │          Same! Ready for dinner?    │ │
│ └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│ [Input field...] [Send]                 │
└─────────────────────────────────────────┘
```

### Messages Screen - Activities Tab
```
┌─────────────────────────────────────────┐
│ Household Chat                          │
├─────────────────────────────────────────┤
│ [Messages] [Activities] [Notes]         │
├─────────────────────────────────────────┤
│                                         │
│ [Avatar] John completed "Buy groceries"│
│          2:15 PM                        │
│                                         │
│ [Avatar] Sarah marked "Clean kitchen"  │
│          2:10 PM                        │
│                                         │
│ [Avatar] Mike joined the household     │
│          1:45 PM                        │
│                                         │
│ [Avatar] Sarah created "Laundry day"   │
│          1:30 PM                        │
│                                         │
│ [Avatar] John paid $25 to Sarah        │
│          1:15 PM                        │
│                                         │
└─────────────────────────────────────────┘
```

### Messages Screen - Notes Tab
```
┌─────────────────────────────────────────┐
│ Household Chat                          │
├─────────────────────────────────────────┤
│ [Messages] [Activities] [Notes]         │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [Avatar] Sarah         2:45 PM      │ │
│ │          Remember to buy milk,      │ │
│ │          eggs, and bread!           │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [Avatar] John          2:30 PM      │ │
│ │          WiFi password: ABC123      │ │
│ │          (edited)                   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [Avatar] Mike          2:00 PM      │ │
│ │          Trash day is Thursday      │ │
│ └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│ [Input field...] [Send]                 │
└─────────────────────────────────────────┘
```

---

## 🏠 Dashboard Header

### Before (Original)
```
┌─────────────────────────────────────────┐
│ 🏠 SplitDuty              ⭐ Score  👤  │
│    Household Manager                    │
├─────────────────────────────────────────┤
│ ☀️ Good morning, John!                  │
│    Mon, Oct 28                          │
└─────────────────────────────────────────┘
```

### After (With Message Icon)
```
┌─────────────────────────────────────────┐
│ 🏠 SplitDuty      💬(3) ⭐ Score  👤   │
│    Household Manager                    │
├─────────────────────────────────────────┤
│ ☀️ Good morning, John!                  │
│    Mon, Oct 28                          │
└─────────────────────────────────────────┘
```

### Message Icon Detail
```
Position: Top Right (before score badge)
Icon: 💬 (chat bubble)
Badge: Red circle with count
Badge Size: 20x20px
Badge Position: Top-right of icon
Badge Text: White, bold, 11px
Badge Logic: Shows "9+" if count > 9
```

---

## 🎨 Message Item Layout

### Message Item Structure
```
┌─────────────────────────────────────────┐
│ [Avatar] Name              Time         │
│ 40x40px  16px bold         12px gray    │
│          Message content...             │
│          14px, line-height 20px         │
│          (edited)                       │
│          11px italic gray               │
└─────────────────────────────────────────┘
```

### Avatar Variations
```
With Image:
┌────┐
│ 🖼️ │  (User's photo from Supabase)
└────┘

Without Image:
┌────┐
│ J  │  (First letter on red background)
└────┘

Fallback:
┌────┐
│ 👤 │  (Default emoji)
└────┘
```

---

## 🎯 Tab Navigation

### Tab Bar Layout
```
┌─────────────────────────────────────────┐
│ [Messages] [Activities] [Notes]         │
│  (active)   (inactive)   (inactive)     │
└─────────────────────────────────────────┘
```

### Tab Styling
```
Active Tab:
- Background: #FF6B6B (Coral Red)
- Text: #fff (White)
- Border Radius: 20px
- Padding: 12px horizontal, 8px vertical

Inactive Tab:
- Background: #f5f5f5 (Light Gray)
- Text: #666 (Gray)
- Border Radius: 20px
- Padding: 12px horizontal, 8px vertical
```

---

## 💬 Message Input Area

### Input Layout
```
┌─────────────────────────────────────────┐
│ [Input field...] [Send]                 │
│  flex: 1                 bg: #FF6B6B    │
│  bg: #f5f5f5             color: #fff    │
│  border-radius: 20px     padding: 10px  │
│  padding: 16px           border-radius: │
│  max-height: 100px       20px           │
└─────────────────────────────────────────┘
```

### Input States
```
Empty:
- Send button: Disabled (opacity 0.5)
- Placeholder: "Send a message..."

Typing:
- Send button: Enabled
- Placeholder: Hidden

Sending:
- Send button: Loading spinner
- Input: Disabled
- Placeholder: Hidden

Sent:
- Input: Cleared
- Success animation: Shows "✓ Message sent!"
```

---

## ✨ Animations

### Send Animation
```
Timeline:
0ms    - User taps Send
100ms  - Loading spinner shows
300ms  - Message appears in list
500ms  - Success message fades in
1500ms - Success message fades out
```

### Success Message
```
┌─────────────────────────────────────────┐
│ ✓ Message sent!                         │
│ bg: #4CAF50 (Green)                     │
│ color: #fff (White)                     │
│ border-radius: 8px                      │
│ padding: 12px horizontal, 12px vertical │
│ position: absolute bottom 80px          │
└─────────────────────────────────────────┘
```

### Tab Transition
```
User taps tab:
1. Tab highlight changes (instant)
2. Content fades out (100ms)
3. New content fades in (100ms)
4. Smooth transition
```

---

## 🔴 Unread Badge

### Badge Styling
```
Position: Top-right of message icon
Size: 20x20px
Border Radius: 10px (circular)
Background: #FF6B6B (Coral Red)
Border: 2px white
Text: White, bold, 11px
Margin: -4px top, -4px right

Examples:
- Count 1: "1"
- Count 5: "5"
- Count 9: "9"
- Count 10+: "9+"
```

### Badge Visibility
```
Show when:
- Unread count > 0

Hide when:
- Unread count = 0
- User opens messages

Update when:
- New message received
- Message marked as read
- User switches household
```

---

## 🎨 Color Palette

### Primary Colors
```
Coral Red:     #FF6B6B  (Primary action, badges)
White:         #FFFFFF  (Background, text on red)
Light Gray:    #f5f5f5  (Secondary background)
Dark Gray:     #1a1a1a  (Primary text)
Medium Gray:   #666     (Secondary text)
Border Gray:   #f0f0f0  (Borders)
Green:         #4CAF50  (Success message)
```

### Usage
```
Primary Actions:  #FF6B6B (Send button, active tab)
Backgrounds:      #fff, #f5f5f5
Text:             #1a1a1a, #666
Borders:          #f0f0f0
Success:          #4CAF50
```

---

## 📐 Spacing & Sizing

### Padding & Margins
```
Header:        16px horizontal, 16px vertical
Tabs:          12px horizontal, 12px vertical
Messages:      16px horizontal, 12px vertical
Avatar:        40x40px (messages), 32x32px (activities)
Input:         16px horizontal, 12px vertical
Badge:         20x20px
```

### Font Sizes
```
Header Title:  24px, bold
Tab Text:      14px, semi-bold
Message Name:  14px, semi-bold
Message Time:  12px, gray
Message Text:  14px, normal
Activity Text: 13px, normal
Input:         14px, normal
Badge:         11px, bold
```

---

## 🔄 Data Flow

### Message Send Flow
```
User Types Message
    ↓
Tap Send Button
    ↓
MessageService.sendMessage()
    ↓
Insert to household_messages
    ↓
Trigger real-time event
    ↓
All subscribers notified
    ↓
Messages refresh
    ↓
Success animation
    ↓
Input cleared
```

### Real-time Update Flow
```
New Message Inserted
    ↓
Supabase Real-time Event
    ↓
Subscription Callback
    ↓
fetchMessages()
    ↓
Update state
    ↓
UI re-renders
    ↓
Message appears
```

---

## 📊 Component Hierarchy

```
MessagesScreen
├── Header
│   └── Title
├── TabsContainer
│   ├── Tab (Messages)
│   ├── Tab (Activities)
│   └── Tab (Notes)
├── MessagesList
│   ├── MessageItem
│   │   ├── Avatar
│   │   ├── Content
│   │   │   ├── Header (Name, Time)
│   │   │   ├── Text
│   │   │   └── EditedLabel
│   │   └── Reactions
│   └── ActivityItem
│       ├── Avatar
│       ├── Content
│       │   ├── Text
│       │   └── Time
│       └── Icon
├── InputContainer
│   ├── TextInput
│   └── SendButton
└── SuccessMessage
    └── Text
```

---

## ✅ Implementation Checklist

- [x] Database schema created
- [x] Messages screen built
- [x] Three tabs implemented
- [x] Message input working
- [x] Real-time updates configured
- [x] Dashboard icon added
- [x] Unread badge implemented
- [x] Animations added
- [x] Avatars displaying
- [x] Timestamps formatting
- [x] Success animation showing
- [x] Documentation complete

**Status**: COMPLETE ✅

