# 🎬 Lottie Animations Guide

## 📚 What is Lottie?

Lottie is a library that renders Adobe After Effects animations natively on mobile and web. It's perfect for:
- Smooth, lightweight animations
- Human illustrations
- Interactive elements
- Loading states

---

## 🚀 Getting Started

### **Step 1: Find Animations**

Visit: https://lottiefiles.com

Search for:
- "Household management"
- "Task management"
- "Bill splitting"
- "Family"
- "Teamwork"

### **Step 2: Download .lottie Files**

1. Find animation you like
2. Click "Download"
3. Select ".lottie" format
4. Save to `assets/animations/`

### **Step 3: Create Folder Structure**

```
assets/
├── animations/
│   ├── household.lottie
│   ├── tasks.lottie
│   ├── bills.lottie
│   ├── celebration.lottie
│   └── loading.lottie
└── images/
```

---

## 💻 Implementation Examples

### **Example 1: Intro Screen with Animation**

```typescript
import { DotLottie } from '@lottiefiles/dotlottie-react-native'

export default function IntroScreen() {
  return (
    <View style={styles.container}>
      <DotLottie
        source={require('../../assets/animations/household.lottie')}
        loop
        autoplay
        style={{ width: 250, height: 250 }}
      />
      
      <Text style={styles.title}>Welcome to SplitDuty</Text>
      <Text style={styles.subtitle}>
        Manage household tasks and split bills fairly
      </Text>
    </View>
  )
}
```

### **Example 2: Features Screen with Multiple Animations**

```typescript
const features = [
  {
    title: 'Smart Task Assignment',
    animation: require('../../assets/animations/tasks.lottie'),
  },
  {
    title: 'Easy Bill Splitting',
    animation: require('../../assets/animations/bills.lottie'),
  },
  {
    title: 'Smart Notifications',
    animation: require('../../assets/animations/notification.lottie'),
  },
]

export default function FeaturesScreen() {
  return (
    <View>
      {features.map((feature, index) => (
        <View key={index} style={styles.featureCard}>
          <DotLottie
            source={feature.animation}
            loop
            autoplay
            style={{ width: 150, height: 150 }}
          />
          <Text style={styles.featureTitle}>{feature.title}</Text>
        </View>
      ))}
    </View>
  )
}
```

### **Example 3: Loading Animation**

```typescript
export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <DotLottie
        source={require('../../assets/animations/loading.lottie')}
        loop
        autoplay
        style={{ width: 100, height: 100 }}
      />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  )
}
```

### **Example 4: Success Animation**

```typescript
export default function SuccessScreen() {
  return (
    <View style={styles.container}>
      <DotLottie
        source={require('../../assets/animations/celebration.lottie')}
        loop={false}
        autoplay
        style={{ width: 200, height: 200 }}
      />
      <Text style={styles.successText}>All set!</Text>
    </View>
  )
}
```

---

## 🎨 Recommended Animations

### **For Intro Screen**
- Household/Family illustration
- People collaborating
- Happy family

### **For Features Screen**
- Task assignment animation
- Bill splitting animation
- Notification animation
- Approval animation

### **For Welcome Screen**
- Sign up illustration
- Login illustration
- Household creation

### **For Dashboard**
- Loading animation
- Empty state animation
- Success animation

---

## 🔧 Advanced Usage

### **Control Animation Playback**

```typescript
import { useRef } from 'react'
import { DotLottie } from '@lottiefiles/dotlottie-react-native'

export default function ControlledAnimation() {
  const dotLottieRef = useRef(null)

  const handlePlay = () => {
    dotLottieRef.current?.play()
  }

  const handlePause = () => {
    dotLottieRef.current?.pause()
  }

  return (
    <View>
      <DotLottie
        ref={dotLottieRef}
        source={require('../../assets/animations/household.lottie')}
        style={{ width: 200, height: 200 }}
      />
      
      <TouchableOpacity onPress={handlePlay}>
        <Text>Play</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={handlePause}>
        <Text>Pause</Text>
      </TouchableOpacity>
    </View>
  )
}
```

### **Animation with Speed Control**

```typescript
<DotLottie
  source={require('../../assets/animations/household.lottie')}
  speed={1.5}  // 1.5x speed
  loop
  autoplay
  style={{ width: 200, height: 200 }}
/>
```

### **Animation with Segment**

```typescript
<DotLottie
  source={require('../../assets/animations/household.lottie')}
  segment={[0, 50]}  // Play frames 0-50
  loop
  autoplay
  style={{ width: 200, height: 200 }}
/>
```

---

## 📱 Responsive Animations

```typescript
import { Dimensions } from 'react-native'

const { width } = Dimensions.get('window')
const animationSize = width > 600 ? 300 : 200

<DotLottie
  source={require('../../assets/animations/household.lottie')}
  loop
  autoplay
  style={{ width: animationSize, height: animationSize }}
/>
```

---

## 🎯 Best Practices

1. **Use .lottie format** - Better performance than JSON
2. **Optimize file size** - Keep animations under 500KB
3. **Test on devices** - Ensure smooth playback
4. **Use loop wisely** - Not all animations should loop
5. **Responsive sizing** - Adapt to screen size
6. **Fallback content** - Have backup if animation fails

---

## 🚀 Quick Setup Steps

1. **Create folder**
   ```bash
   mkdir -p assets/animations
   ```

2. **Download animations**
   - Visit lottiefiles.com
   - Download .lottie files
   - Save to `assets/animations/`

3. **Update metro.config.js** ✅ (Already done!)

4. **Import in screens**
   ```typescript
   import { DotLottie } from '@lottiefiles/dotlottie-react-native'
   ```

5. **Add to JSX**
   ```typescript
   <DotLottie
     source={require('../../assets/animations/household.lottie')}
     loop
     autoplay
     style={{ width: 200, height: 200 }}
   />
   ```

6. **Test**
   ```bash
   npx expo start
   ```

---

## 📚 Resources

- **LottieFiles**: https://lottiefiles.com
- **Documentation**: https://developers.lottiefiles.com
- **React Native Docs**: https://reactnative.dev

---

## ✅ Checklist

- [ ] Create `assets/animations/` folder
- [ ] Download .lottie files
- [ ] Import DotLottie in screens
- [ ] Add animations to intro screen
- [ ] Add animations to features screen
- [ ] Add animations to welcome screen
- [ ] Test on mobile
- [ ] Test on web
- [ ] Optimize file sizes
- [ ] Deploy

---

## 🎊 You're Ready!

Your app is now ready for beautiful Lottie animations!

Start adding animations to make your onboarding experience amazing! 🚀


