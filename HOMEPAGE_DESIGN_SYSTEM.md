# 🎨 Homepage Design System

## 🎯 Design Philosophy

**Connected, Intuitive, Beautiful**

- **Connected**: All sections relate to each other
- **Intuitive**: Users understand flow naturally
- **Beautiful**: Modern, polished, professional

---

## 🌈 Color Palette

### **Primary Colors**
```
Tasks:       #667eea (Blue)      - Planning & Organization
Bills:       #27AE60 (Green)     - Money & Finance
Approvals:   #FFD93D (Yellow)    - Verification & Validation
Messages:    #FF6B6B (Red)       - Communication
Members:     #f093fb (Purple)    - People & Collaboration
Analytics:   #FF9500 (Orange)    - Insights & Data
```

### **Neutral Colors**
```
Background:  #f8f9fa (Light Gray)
Surface:     #ffffff (White)
Text:        #333333 (Dark Gray)
Muted:       #999999 (Medium Gray)
Border:      #e0e0e0 (Light Border)
```

### **Semantic Colors**
```
Success:     #27AE60 (Green)
Warning:     #FFD93D (Yellow)
Error:       #FF6B6B (Red)
Info:        #667eea (Blue)
```

---

## 📐 Typography

### **Font Family**
- Primary: San Francisco Pro Display (iOS)
- Fallback: Roboto (Android)
- Monospace: SF Mono (for data)

### **Font Sizes**
```
Hero Title:      24px Bold
Section Title:   18px SemiBold
Card Title:      16px Medium
Body Text:       14px Regular
Meta Text:       12px Regular
Caption:         11px Light
```

### **Font Weights**
```
Light:       300
Regular:     400
Medium:      500
SemiBold:    600
Bold:        700
```

### **Line Heights**
```
Tight:       1.2
Normal:      1.5
Relaxed:     1.8
```

---

## 📏 Spacing System

### **Base Unit: 4px**
```
xs:  4px   (1 unit)
sm:  8px   (2 units)
md:  12px  (3 units)
lg:  16px  (4 units)
xl:  20px  (5 units)
2xl: 24px  (6 units)
3xl: 32px  (8 units)
```

### **Common Spacing**
```
Padding:     16px (lg)
Margin:      24px (2xl)
Gap:         12px (md)
Border:      1px
Radius:      12px
```

---

## 🎬 Animation System

### **Timing**
```
Fast:        150ms (Button press)
Base:        250-300ms (Standard)
Slow:        350-400ms (Entrance)
Spring:      Variable (Interactive)
```

### **Easing**
```
Linear:      Constant speed
EaseIn:      Slow start
EaseOut:     Slow end
EaseInOut:   Slow start & end
Spring:      Bouncy feel
```

### **Animation Types**
```
Fade:        Opacity change
Slide:       Position change
Scale:       Size change
Rotate:      Rotation change
Spring:      Bouncy animation
```

---

## 🎨 Component Styles

### **Hero Section**
```
Background:  Gradient (Blue → Purple)
Padding:     24px vertical, 20px horizontal
Text Color:  White
Border:      None
Shadow:      None
```

### **Status Card**
```
Background:  Gradient (Red → Light Red)
Padding:     16px
Text Color:  White
Border:      None
Shadow:      Elevation 4
Radius:      12px
```

### **Quick Action Card**
```
Background:  Gradient (Color → Darker)
Padding:     16px
Text Color:  White
Border:      None
Shadow:      Elevation 2
Radius:      12px
Size:        (width - 64) / 3
```

### **Connected Card**
```
Background:  White
Padding:     16px
Text Color:  Dark Gray
Border:      Left 4px (Color)
Shadow:      Elevation 2
Radius:      12px
```

### **Analytics Card**
```
Background:  White
Padding:     16px
Text Color:  Dark Gray
Border:      None
Shadow:      Elevation 2
Radius:      12px
```

---

## 🔲 Layout Grid

### **Mobile (< 600px)**
```
Columns:     1
Gutter:      16px
Margin:      16px
Max Width:   Full
```

### **Tablet (600px - 1000px)**
```
Columns:     2
Gutter:      20px
Margin:      24px
Max Width:   Full
```

### **Desktop (> 1000px)**
```
Columns:     3
Gutter:      24px
Margin:      32px
Max Width:   1200px
```

---

## 🎯 Component Hierarchy

### **Level 1: Hero Section**
- Highest visual priority
- Full width
- Gradient background
- Large typography

### **Level 2: Status Card**
- High priority
- Full width
- Colored background
- Important metrics

### **Level 3: Quick Actions**
- Medium priority
- Grid layout
- Colored cards
- Interactive

### **Level 4: Connected Cards**
- Medium priority
- Full width
- White background
- Detailed content

### **Level 5: Activity Feed**
- Lower priority
- Full width
- Minimal styling
- Scrollable

---

## 🎪 Visual Hierarchy

```
Hero Section (Largest, Most Important)
    ↓
Status Card (Large, Important)
    ↓
Quick Actions (Medium, Interactive)
    ↓
Connected Cards (Medium, Detailed)
    ↓
Analytics (Small, Informational)
    ↓
Activity Feed (Smallest, Supplementary)
```

---

## 🌟 Visual Effects

### **Shadows**
```
Elevation 1: 0 1px 2px rgba(0,0,0,0.05)
Elevation 2: 0 2px 4px rgba(0,0,0,0.08)
Elevation 3: 0 4px 8px rgba(0,0,0,0.12)
Elevation 4: 0 8px 16px rgba(0,0,0,0.15)
```

### **Blur Effects**
```
Light:       Blur 4px
Medium:      Blur 8px
Heavy:       Blur 16px
```

### **Gradients**
```
Hero:        Blue → Purple
Status:      Red → Light Red
Action:      Color → Darker
```

---

## ♿ Accessibility

### **Color Contrast**
- Text on background: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

### **Touch Targets**
- Minimum size: 44x44px
- Spacing: 8px between targets
- Feedback: Visual + Haptic

### **Typography**
- Minimum size: 12px
- Maximum line length: 70 characters
- Line height: 1.5 minimum

---

## 📱 Responsive Breakpoints

```
Mobile:      < 600px
Tablet:      600px - 1000px
Desktop:     > 1000px
```

---

## 🎨 Dark Mode (Future)

### **Color Adjustments**
```
Background:  #1a1a1a
Surface:     #2d2d2d
Text:        #f0f0f0
Muted:       #999999
```

### **Gradient Adjustments**
```
Hero:        Darker Blue → Darker Purple
Status:      Darker Red → Darker Light Red
```

---

## 📊 Design Tokens

```typescript
const tokens = {
  colors: {
    primary: '#667eea',
    secondary: '#27AE60',
    accent: '#FFD93D',
    background: '#f8f9fa',
    surface: '#ffffff',
    text: '#333333',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
  },
  typography: {
    heroTitle: { fontSize: 24, fontWeight: '700' },
    sectionTitle: { fontSize: 18, fontWeight: '600' },
    cardTitle: { fontSize: 16, fontWeight: '500' },
  },
  animation: {
    fast: 150,
    base: 300,
    slow: 400,
  },
}
```

---

## ✅ Design Checklist

- [ ] Colors match brand
- [ ] Typography is readable
- [ ] Spacing is consistent
- [ ] Animations are smooth
- [ ] Shadows are subtle
- [ ] Gradients are beautiful
- [ ] Responsive on all sizes
- [ ] Accessible for all users
- [ ] Performance is optimized
- [ ] Feedback is clear


