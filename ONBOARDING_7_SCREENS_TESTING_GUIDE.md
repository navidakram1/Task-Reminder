# 🧪 7-Screen Onboarding - Testing Guide

## 📋 Overview

Complete testing checklist for the new 7-screen onboarding flow.

---

## ✅ Testing Checklist

### **Screen 1: Welcome to SplitDuty**

**Visual Testing:**
- [ ] Gradient background displays correctly (blue → purple → pink)
- [ ] Lottie animation loads and plays
- [ ] App name "SplitDuty" is visible and centered
- [ ] Tagline "Share Life, Split Smart" is visible
- [ ] Subtitle text is readable
- [ ] Progress indicator shows 1/7 (first dot active)

**Interaction Testing:**
- [ ] "Get Started" button is clickable
- [ ] "Get Started" navigates to Screen 2
- [ ] "Log In" link is clickable
- [ ] "Log In" navigates to login screen
- [ ] Animations play smoothly

**Responsive Testing:**
- [ ] Mobile (375px): Layout looks good
- [ ] Tablet (768px): Layout looks good
- [ ] Desktop (1024px+): Layout looks good

---

### **Screen 2: Say Goodbye to Chaos**

**Visual Testing:**
- [ ] Gradient background displays correctly (coral → pink → orange)
- [ ] Lottie animation loads and plays
- [ ] Title "Say Goodbye to Chaos" is visible
- [ ] Subtitle text is readable
- [ ] 3 metric cards display correctly
- [ ] Metric sliders animate from before to after values
- [ ] Progress indicator shows 2/7 (first two dots active)

**Interaction Testing:**
- [ ] "Show Me How" button is clickable
- [ ] "Show Me How" navigates to Screen 3
- [ ] Metric sliders animate on load
- [ ] Animations are smooth

**Responsive Testing:**
- [ ] Mobile (375px): Cards stack vertically
- [ ] Tablet (768px): Cards display properly
- [ ] Desktop (1024px+): Cards display properly

---

### **Screen 3: Meet Your AI Fairness Engine**

**Visual Testing:**
- [ ] Gradient background displays correctly (purple → deep purple)
- [ ] Lottie animation loads and plays
- [ ] Title with emoji is visible
- [ ] Subtitle text is readable
- [ ] 3 feature items display with icons
- [ ] Feature cards have proper styling
- [ ] Progress indicator shows 3/7

**Interaction Testing:**
- [ ] "Next: See It in Action" button is clickable
- [ ] Button navigates to Screen 4
- [ ] Animations play smoothly

**Responsive Testing:**
- [ ] Mobile (375px): Feature items stack properly
- [ ] Tablet (768px): Feature items display well
- [ ] Desktop (1024px+): Feature items display well

---

### **Screen 4: See It in Action**

**Visual Testing:**
- [ ] Gradient background displays correctly (teal → mint → green)
- [ ] Lottie animation loads and plays
- [ ] Title with emoji is visible
- [ ] Subtitle text is readable
- [ ] Demo card displays with person rows
- [ ] Task bars show fair distribution (33% each)
- [ ] Benefit items display with checkmarks
- [ ] Progress indicator shows 4/7

**Interaction Testing:**
- [ ] "Let's Get Started" button is clickable
- [ ] Button navigates to Screen 5
- [ ] Animations play smoothly

**Responsive Testing:**
- [ ] Mobile (375px): Demo card displays properly
- [ ] Tablet (768px): Demo card displays properly
- [ ] Desktop (1024px+): Demo card displays properly

---

### **Screen 5: Welcome to SplitDuty (Final)**

**Visual Testing:**
- [ ] Gradient background displays correctly (sky blue → cyan → lavender)
- [ ] Lottie animation loads and plays
- [ ] Confetti animation plays
- [ ] Title with emoji is visible
- [ ] Subtitle text is readable
- [ ] "Create Account" button displays (green)
- [ ] "Log In" button displays (outline)
- [ ] Progress indicator shows 5/7

**Interaction Testing:**
- [ ] "Create Account" button is clickable
- [ ] "Create Account" navigates to signup
- [ ] "Log In" button is clickable
- [ ] "Log In" navigates to login
- [ ] Confetti animation loops smoothly

**Responsive Testing:**
- [ ] Mobile (375px): Buttons stack properly
- [ ] Tablet (768px): Buttons display well
- [ ] Desktop (1024px+): Buttons display well

---

### **Screen 6: Ready to Bring Harmony Home**

**Visual Testing:**
- [ ] Background displays correctly (light gray → white)
- [ ] Title is visible and readable
- [ ] Subtitle text is readable
- [ ] Split-screen illustration displays (left: house, right: people)
- [ ] Left side has blue background
- [ ] Right side has green background
- [ ] "Create Household" button displays (coral)
- [ ] "Join with Invite Code" button displays (turquoise)
- [ ] Progress indicator shows 6/7

**Interaction Testing:**
- [ ] "Create Household" button is clickable
- [ ] "Create Household" navigates to household creation
- [ ] "Join with Invite Code" button is clickable
- [ ] "Join with Invite Code" navigates to join flow
- [ ] Animations play smoothly

**Responsive Testing:**
- [ ] Mobile (375px): Buttons stack properly
- [ ] Tablet (768px): Buttons display well
- [ ] Desktop (1024px+): Buttons display well

---

### **Screen 7: Profile & Preferences**

**Visual Testing:**
- [ ] Background displays correctly (light gray → white)
- [ ] Title is visible and readable
- [ ] Photo upload area displays with dashed border
- [ ] Name input field displays
- [ ] 4 notification preference items display
- [ ] Toggle switches display correctly
- [ ] "Complete Setup" button displays (green)
- [ ] Progress indicator shows 7/7 (all dots active)

**Interaction Testing:**
- [ ] Photo upload area is clickable
- [ ] Name input accepts text
- [ ] Toggle switches toggle on/off
- [ ] "Complete Setup" button is disabled when name is empty
- [ ] "Complete Setup" button is enabled when name is filled
- [ ] "Complete Setup" navigates to dashboard

**Responsive Testing:**
- [ ] Mobile (375px): Form displays properly
- [ ] Tablet (768px): Form displays properly
- [ ] Desktop (1024px+): Form displays properly

---

## 🔄 Navigation Flow Testing

**Test Complete Flow:**
- [ ] Screen 1 → Screen 2 (Get Started)
- [ ] Screen 2 → Screen 3 (Show Me How)
- [ ] Screen 3 → Screen 4 (Next)
- [ ] Screen 4 → Screen 5 (Let's Get Started)
- [ ] Screen 5 → Screen 6 (Create Account)
- [ ] Screen 6 → Screen 7 (Create Household)
- [ ] Screen 7 → Dashboard (Complete Setup)

**Test Alternative Flows:**
- [ ] Screen 1 → Login (Log In link)
- [ ] Screen 5 → Login (Log In button)
- [ ] Screen 6 → Join Household (Join with Invite Code)

---

## 🎨 Color & Animation Testing

**Colors:**
- [ ] All gradients display smoothly
- [ ] Text colors are readable on all backgrounds
- [ ] Button colors are consistent
- [ ] Progress indicators show correct colors

**Animations:**
- [ ] Fade animations play smoothly
- [ ] Slide animations play smoothly
- [ ] Scale animations play smoothly
- [ ] Lottie animations load correctly
- [ ] Confetti animation loops properly
- [ ] No animation stuttering or lag

---

## 📱 Device Testing

**Mobile Devices:**
- [ ] iPhone 12 (390x844)
- [ ] iPhone 14 Pro (393x852)
- [ ] Samsung Galaxy S21 (360x800)
- [ ] Pixel 6 (412x915)

**Tablets:**
- [ ] iPad (768x1024)
- [ ] iPad Pro (1024x1366)
- [ ] Android Tablet (600x1024)

**Web:**
- [ ] Chrome (1920x1080)
- [ ] Safari (1920x1080)
- [ ] Firefox (1920x1080)

---

## 🐛 Bug Tracking

### **Critical Issues:**
- [ ] Navigation breaks
- [ ] Animations crash
- [ ] Buttons don't work
- [ ] Text is unreadable

### **Major Issues:**
- [ ] Layout breaks on certain devices
- [ ] Colors don't display correctly
- [ ] Animations are slow

### **Minor Issues:**
- [ ] Spacing is slightly off
- [ ] Font sizes could be adjusted
- [ ] Animation timing could be tweaked

---

## ✅ Sign-Off Checklist

- [ ] All 7 screens created
- [ ] Navigation updated
- [ ] All visual tests passed
- [ ] All interaction tests passed
- [ ] All responsive tests passed
- [ ] All animations working
- [ ] All colors correct
- [ ] No critical bugs
- [ ] Ready for deployment

---

**Status: READY FOR TESTING** ✅


