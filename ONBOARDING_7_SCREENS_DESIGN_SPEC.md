# 🎯 SplitDuty 7-Screen Onboarding - Design Specification

## 📋 Overview

Complete redesign of onboarding flow from 6 screens to 7 screens with new design, animations, and user journey.

---

## 🎨 Color Theme

### **Primary Colors**
- **Primary:** #FF6B6B (Coral/Salmon Red)
- **Secondary:** #4ECDC4 (Turquoise)
- **Background:** #F8F9FA (Light Gray)
- **Surface:** #FFFFFF (White)
- **Text Primary:** #1A1A1A (Almost Black)
- **Text Secondary:** #6B7280 (Gray)

### **Gradients by Screen**
1. **Screen 1:** Blue → Violet (Brand gradient)
2. **Screen 2:** Coral → Pink → Orange (Transformation)
3. **Screen 3:** Purple → Blue (Intelligence)
4. **Screen 4:** Teal → Mint Green (Clarity)
5. **Screen 5:** Sky Blue → Lavender (Celebration)
6. **Screen 6:** Neutral (Setup)
7. **Screen 7:** Neutral (Profile)

---

## 📱 The 7 Screens

### **Screen 1: Welcome to SplitDuty** 🏠
**Duration:** 30-60 seconds
**Purpose:** First impression, brand introduction

**Content:**
- Lottie animation (happy roommates/household)
- App name: "SplitDuty"
- Tagline: "Share Life, Split Smart"
- Subtitle: "Simplify your shared living with AI-powered fairness and smart collaboration"
- CTA: "Get Started" (green button)
- Link: "Already have an account? Log In"

**Design:**
- Gradient background (blue → violet)
- Centered layout
- Large animation (250x250px)
- Clear typography hierarchy

---

### **Screen 2: Say Goodbye to Chaos** 🌪️
**Duration:** 60-90 seconds
**Purpose:** Problem statement, emotional connection

**Content:**
- Lottie animation: Chaos transforming to harmony
- Title: "Say Goodbye to Chaos"
- Subtitle: "No more messy chore charts, forgotten bills, or unfair workloads. SplitDuty turns household chaos into calm collaboration."
- Sliders: Show before/after metrics
  - Chore Fairness: 20% → 100%
  - Bill Clarity: 30% → 100%
  - Household Peace: 40% → 100%
- CTA: "Show Me How" (green button)
- Progress: ••○○○○○ (1/7)

**Design:**
- Gradient: Coral → Pink → Orange
- Animated icons floating upward
- Slider animations
- Soft, rounded typography

---

### **Screen 3: Meet Your AI Fairness Engine** 🤖
**Duration:** 60-90 seconds
**Purpose:** Introduce AI/intelligence

**Content:**
- Lottie animation: Robot brain or balancing scale
- Title: "Meet Your AI Fairness Engine 🤖"
- Subtitle: "It learns your habits, schedules, and contributions to make chores, bills, and shared responsibilities 100% fair — automatically."
- Key points:
  - ✓ Learns your patterns
  - ✓ Adapts to changes
  - ✓ Ensures fairness
- CTA: "Next: See It in Action" (green button)
- Progress: •••○○○○ (3/7)

**Design:**
- Gradient: Purple → Blue
- Calm, trustworthy aesthetic
- Clear benefit statements

---

### **Screen 4: See It in Action** ⚡
**Duration:** 60-90 seconds
**Purpose:** Demonstrate functionality

**Content:**
- Lottie animation: Circles (people) + icons (tasks) connecting
- Title: "See It in Action ⚡"
- Subtitle: "Watch how SplitDuty instantly divides cleaning, shopping, and bills fairly — no arguments, no confusion, just balance."
- Visual: Fair split animation
- CTA: "Let's Get Started" (green button)
- Progress: ••••○○○ (4/7)

**Design:**
- Gradient: Teal → Mint Green
- Dynamic animation
- Clear, simple messaging

---

### **Screen 5: Welcome to SplitDuty (Final)** 🎉
**Duration:** 30-60 seconds
**Purpose:** Wrap-up, celebration

**Content:**
- Lottie animation: Happy home/team celebration
- Title: "Welcome to SplitDuty 🏠"
- Subtitle: "Your AI-powered home manager is ready to keep everything fair, simple, and stress-free."
- CTAs:
  - "Create Account" (green button)
  - "Log In" (outline button)
- Progress: •••••○○ (5/7)

**Design:**
- Gradient: Sky Blue → Lavender
- Optimistic, celebratory tone
- Two CTA options

---

### **Screen 6: Ready to Bring Harmony Home?** 🏠
**Duration:** 60-120 seconds
**Purpose:** Household setup

**Content:**
- Split-screen illustration (left = owner, right = members)
- Title: "Ready to Bring Harmony Home?"
- Subtitle: "Join or create your household in under a minute."
- CTAs:
  - "🏠 Create Household" (primary button)
  - "🔗 Join with Invite Code" (secondary button)
- Progress: ••••••○ (6/7)

**Design:**
- Clean, neutral background
- Split-screen visual
- Smooth transition animation

---

### **Screen 7: Profile & Preferences** 👤
**Duration:** 60-120 seconds
**Purpose:** Complete setup

**Content:**
- Profile photo upload/camera
- Name input field
- Notification preferences:
  - Email notifications (toggle)
  - Push notifications (toggle)
  - Task reminders (toggle)
  - Bill alerts (toggle)
- CTA: "Complete Setup" (green button)
- Progress: •••••••  (7/7)

**Design:**
- Clean, minimal design
- Clear form layout
- Confirmation feedback

---

## 🎬 Lottie Animations Needed

| Screen | Animation | Source |
|--------|-----------|--------|
| 1 | Happy household/roommates | LottieFiles or create |
| 2 | Chaos → Harmony transformation | LottieFiles or create |
| 3 | Robot brain or balance scale | LottieFiles or create |
| 4 | Task/bill distribution | LottieFiles or create |
| 5 | Celebration/happy home | LottieFiles or create |
| 6 | N/A (illustration) | Design or use SVG |
| 7 | N/A (form) | N/A |

---

## 📐 Design System

### **Typography**
- **Hero Title:** 28px, Bold (700)
- **Title:** 24px, Bold (700)
- **Subtitle:** 16px, Regular (400)
- **Body:** 14px, Regular (400)
- **Caption:** 12px, Regular (400)

### **Spacing**
- **Horizontal Padding:** 20px
- **Vertical Gaps:** 16px
- **Card Padding:** 24px
- **Border Radius:** 12-16px

### **Buttons**
- **Height:** 48px
- **Border Radius:** 12px
- **Primary:** #FF6B6B (Coral)
- **Secondary:** #4ECDC4 (Turquoise)
- **Outline:** Transparent with border

---

## 🔄 Navigation Flow

```
Screen 1 (Welcome)
    ↓ Get Started
Screen 2 (Say Goodbye to Chaos)
    ↓ Show Me How
Screen 3 (AI Fairness Engine)
    ↓ Next
Screen 4 (See It in Action)
    ↓ Let's Get Started
Screen 5 (Welcome Final)
    ↓ Create Account / Log In
Screen 6 (Harmony Home)
    ↓ Create / Join
Screen 7 (Profile Setup)
    ↓ Complete Setup
Dashboard
```

---

## ✅ Implementation Checklist

- [ ] Create 7 new screen files
- [ ] Update navigation layout
- [ ] Find/create Lottie animations
- [ ] Apply color theme
- [ ] Add typography styles
- [ ] Implement animations
- [ ] Add progress indicators
- [ ] Test responsiveness
- [ ] Test navigation flow
- [ ] Create documentation

---

## 📁 File Structure

```
app/(onboarding)/
├── _layout.tsx
├── screen-1-welcome.tsx
├── screen-2-chaos.tsx
├── screen-3-ai-engine.tsx
├── screen-4-action.tsx
├── screen-5-welcome-final.tsx
├── screen-6-harmony.tsx
└── screen-7-profile.tsx
```

---

## 🎯 Key Features

✅ **7 Progressive Screens** - Clear journey
✅ **Lottie Animations** - Engaging visuals
✅ **Color Gradients** - Unique per screen
✅ **Progress Indicators** - Show progress
✅ **Responsive Design** - All devices
✅ **Clear CTAs** - Easy navigation
✅ **Emotional Connection** - Problem → Solution
✅ **AI Focus** - Highlight intelligence

---

**Status: DESIGN SPEC COMPLETE** ✅

Ready to start implementation!


