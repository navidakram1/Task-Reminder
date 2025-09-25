# 🎬 Install Lottie Animations for HomeTask

## Current Status
✅ **App is working** with emoji icons  
⏳ **Lottie animations ready** - just need to install the package  
🎯 **All animation files created** and configured  

## Quick Installation

### Option 1: Using npm (Recommended)
```bash
npm install
```

### Option 2: Using Expo CLI
```bash
npx expo install --fix
```

### Option 3: Manual Package Installation
```bash
npm install lottie-react-native@7.2.2
```

## After Installation

1. **Restart your development server**:
   ```bash
   npx expo start --clear
   ```

2. **Enable Lottie animations** by uncommenting this line in `components/navigation/CustomTabBar.tsx`:
   ```typescript
   // import LottieView from 'lottie-react-native' // Will enable after package installation
   ```
   Change to:
   ```typescript
   import LottieView from 'lottie-react-native'
   ```

3. **Update the tabs array** to use animations instead of emojis:
   ```typescript
   const tabs: TabItem[] = [
     { name: 'dashboard', title: 'Home', animation: require('../../assets/animations/home.json'), route: '/(app)/dashboard' },
     { name: 'tasks', title: 'Tasks', animation: require('../../assets/animations/tasks.json'), route: '/(app)/tasks' },
     { name: 'bills', title: 'Bills', animation: require('../../assets/animations/bills.json'), route: '/(app)/bills' },
     { name: 'review', title: 'Review', animation: require('../../assets/animations/approvals.json'), route: '/(app)/approvals' },
     { name: 'proposals', title: 'Proposals', animation: require('../../assets/animations/proposals.json'), route: '/(app)/proposals' },
     { name: 'settings', title: 'Settings', animation: require('../../assets/animations/settings.json'), route: '/(app)/settings' },
   ]
   ```

4. **Update the interface** to support animations:
   ```typescript
   interface TabItem {
     name: string
     title: string
     emoji?: string
     animation?: any
     route: string
   }
   ```

5. **Update the renderTabButton function** to use LottieView:
   ```typescript
   {tab.animation ? (
     <LottieView
       source={tab.animation}
       style={styles.lottieIcon}
       autoPlay={isFocused}
       loop={false}
       speed={1.5}
     />
   ) : (
     <Text style={[styles.tabIcon, isFocused && styles.tabIconActive]}>
       {tab.emoji}
     </Text>
   )}
   ```

## What You'll Get

🏠 **Home**: Animated house with scale effect  
✅ **Tasks**: Checkmark that draws itself  
💰 **Bills**: Rotating dollar sign  
📋 **Proposals**: Floating document  
⭐ **Review**: Sparkling star  
⚙️ **Settings**: Rotating gear  

## Troubleshooting

If you encounter issues:
1. Clear node_modules: `rm -rf node_modules package-lock.json`
2. Reinstall: `npm install`
3. Clear Expo cache: `npx expo start --clear`

## Current Warnings (Normal)

- **expo-notifications warning**: Expected in Expo Go, not an error
- **Navigation warning**: Minor routing issue, doesn't affect functionality
- **TypeScript errors**: Will resolve after package installation
