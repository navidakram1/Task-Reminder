# ⚡ Quick Start - Add Lottie Animations

## 🚀 5-Minute Setup

### **Step 1: Create Folder** (30 seconds)
```bash
mkdir -p assets/animations
```

### **Step 2: Download Animations** (2 minutes)
1. Go to: https://lottiefiles.com
2. Search: "household" or "family"
3. Click animation
4. Download `.lottie` file
5. Save to: `assets/animations/household.lottie`

### **Step 3: Add to Intro Screen** (2 minutes)

Open `app/(onboarding)/intro.tsx` and add:

```typescript
import { DotLottie } from '@lottiefiles/dotlottie-react-native'

// Inside your component, add this after the logo:
<DotLottie
  source={require('../../assets/animations/household.lottie')}
  loop
  autoplay
  style={{ width: 250, height: 250, marginBottom: 20 }}
/>
```

### **Step 4: Test** (1 minute)
```bash
npx expo start
Press 'w' for web
```

---

## 📝 Complete Example

```typescript
import { DotLottie } from '@lottiefiles/dotlottie-react-native'
import { View, Text, StyleSheet } from 'react-native'

export default function IntroScreen() {
  return (
    <View style={styles.container}>
      {/* Lottie Animation */}
      <DotLottie
        source={require('../../assets/animations/household.lottie')}
        loop
        autoplay
        style={styles.animation}
      />

      {/* Text */}
      <Text style={styles.title}>Welcome to SplitDuty</Text>
      <Text style={styles.subtitle}>
        Manage household tasks and split bills fairly
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: 250,
    height: 250,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
})
```

---

## 🎬 Popular Animations to Download

### **For Intro Screen**
- Search: "household management"
- Search: "family collaboration"
- Search: "teamwork"

### **For Features Screen**
- Search: "task management"
- Search: "bill splitting"
- Search: "notification"

### **For Welcome Screen**
- Search: "sign up"
- Search: "login"
- Search: "welcome"

### **For Dashboard**
- Search: "loading"
- Search: "success"
- Search: "celebration"

---

## 🎨 Animation Properties

```typescript
<DotLottie
  source={require('../../assets/animations/household.lottie')}
  
  // Playback
  loop={true}              // Loop animation
  autoplay={true}          // Auto start
  speed={1}                // 1 = normal, 1.5 = 1.5x faster
  
  // Styling
  style={{
    width: 250,
    height: 250,
    marginBottom: 20,
  }}
  
  // Advanced
  segment={[0, 50]}        // Play frames 0-50
  direction={1}            // 1 = forward, -1 = reverse
/>
```

---

## 📱 Responsive Animation

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

## 🎯 Add to Multiple Screens

### **Features Screen**
```typescript
const features = [
  {
    title: 'Smart Tasks',
    animation: require('../../assets/animations/tasks.lottie'),
  },
  {
    title: 'Split Bills',
    animation: require('../../assets/animations/bills.lottie'),
  },
]

{features.map((feature) => (
  <View key={feature.title}>
    <DotLottie
      source={feature.animation}
      loop
      autoplay
      style={{ width: 150, height: 150 }}
    />
    <Text>{feature.title}</Text>
  </View>
))}
```

---

## ✅ Checklist

- [ ] Created `assets/animations/` folder
- [ ] Downloaded `.lottie` files
- [ ] Added DotLottie import
- [ ] Added animation to intro screen
- [ ] Tested on web
- [ ] Tested on mobile
- [ ] Added to features screen
- [ ] Added to welcome screen
- [ ] Optimized file sizes
- [ ] Ready to deploy

---

## 🚀 Deploy

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Or use Expo Go for testing
npx expo start
```

---

## 📚 Resources

- **LottieFiles**: https://lottiefiles.com
- **Docs**: https://developers.lottiefiles.com
- **React Native**: https://reactnative.dev

---

## 🎊 You're Done!

Your app now has beautiful Lottie animations! 🎉

**Next: Download animations and add them to your screens!** 🚀


