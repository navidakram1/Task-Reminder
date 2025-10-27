import { TAB_BAR_THEME } from '@/constants/TabBarTheme'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
    Animated,
    Dimensions,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native'

const { width } = Dimensions.get('window')

interface TabItem {
  name: string
  title: string
  icon: keyof typeof Ionicons.glyphMap
  route: string
}

interface QuickAction {
  title: string
  icon: keyof typeof Ionicons.glyphMap
  route: string
  description: string
  color: string
}

const tabs: TabItem[] = [
  { name: 'dashboard', title: 'Home', icon: 'home', route: '/(app)/dashboard' },
  { name: 'tasks', title: 'Tasks', icon: 'checkmark-circle', route: '/(app)/tasks' },
  { name: 'bills', title: 'Bills', icon: 'wallet', route: '/(app)/bills' },
  { name: 'shopping', title: 'Shopping', icon: 'cart', route: '/(app)/shopping' },
  { name: 'proposals', title: 'Proposals', icon: 'document-text', route: '/(app)/proposals' },
  { name: 'settings', title: 'Settings', icon: 'settings', route: '/(app)/settings' },
]

const quickActions: QuickAction[] = [
  {
    title: 'New Task',
    icon: 'add-circle',
    route: '/(app)/tasks/create',
    description: 'Create a new task',
    color: '#667eea'
  },
  {
    title: 'Add Bill',
    icon: 'cash',
    route: '/(app)/bills/create',
    description: 'Split a new bill',
    color: '#10b981'
  },
  {
    title: 'New Shopping List',
    icon: 'cart',
    route: '/(app)/shopping/create',
    description: 'Create shopping list',
    color: '#FF6B6B'
  },
  {
    title: 'Request Task Review',
    icon: 'checkmark-done-circle',
    route: '/(app)/approvals/create',
    description: 'Ask for task verification',
    color: '#ec4899'
  },
]

interface CustomTabBarProps {
  state: any
  descriptors: any
  navigation: any
}

export default function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const [showBubble, setShowBubble] = useState(false)
  const bubbleAnimation = useRef(new Animated.Value(0)).current
  const scaleAnimation = useRef(new Animated.Value(0)).current
  const tabBarOpacity = useRef(new Animated.Value(0)).current
  const tabBarTranslateY = useRef(new Animated.Value(20)).current

  // Animate tab bar on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(tabBarOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(tabBarTranslateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const showBubbleMenu = () => {
    setShowBubble(true)
    Animated.parallel([
      Animated.spring(bubbleAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(scaleAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start()
  }

  const hideBubbleMenu = () => {
    Animated.parallel([
      Animated.timing(bubbleAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowBubble(false)
    })
  }

  const handleQuickAction = (route: string) => {
    hideBubbleMenu()
    setTimeout(() => {
      router.push(route as any)
    }, 100)
  }

  const renderTabButton = (tab: TabItem, index: number) => {
    const isFocused = state.index === index
    const scaleAnim = useRef(new Animated.Value(1)).current
    const opacityAnim = useRef(new Animated.Value(isFocused ? 1 : 0.6)).current

    const handlePress = () => {
      if (!isFocused) {
        // Haptic feedback
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        }

        // Press animation
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 0.85,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.4,
              duration: 100,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.spring(scaleAnim, {
              toValue: 1,
              friction: 3,
              tension: 40,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
        ]).start()

        router.push(tab.route as any)
      }
    }

    return (
      <TouchableOpacity
        key={tab.name}
        style={styles.tabButton}
        onPress={handlePress}
        activeOpacity={1}
      >
        <Animated.View style={[
          styles.tabIconContainer,
          isFocused && styles.tabIconContainerActive,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }
        ]}>
          <Ionicons
            name={isFocused ? tab.icon : (tab.icon + '-outline' as any)}
            size={isFocused ? 22 : 20}
            color={isFocused ? TAB_BAR_THEME.colors.activeIcon : TAB_BAR_THEME.colors.inactiveIcon}
          />
        </Animated.View>
        <Text
          style={[
            styles.tabLabel,
            isFocused && styles.tabLabelActive
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {tab.title}
        </Text>
      </TouchableOpacity>
    )
  }

  const renderPlusButton = () => {
    const plusScale = useRef(new Animated.Value(1)).current
    const plusRotate = useRef(new Animated.Value(0)).current

    const handlePlusPress = () => {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      }

      // Rotate and scale animation
      Animated.parallel([
        Animated.sequence([
          Animated.timing(plusScale, {
            toValue: 0.85,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.spring(plusScale, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(plusRotate, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        plusRotate.setValue(0)
      })

      showBubbleMenu()
    }

    const rotation = plusRotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '135deg'],
    })

    return (
      <TouchableOpacity
        style={styles.plusButton}
        onPress={handlePlusPress}
        activeOpacity={1}
      >
        <Animated.View
          style={[
            styles.plusButtonInner,
            {
              transform: [{ scale: plusScale }, { rotate: rotation }],
            }
          ]}
        >
          <Ionicons name="add" size={28} color={TAB_BAR_THEME.colors.activeIcon} />
        </Animated.View>
      </TouchableOpacity>
    )
  }

  const renderBubbleMenu = () => (
    <Modal
      visible={showBubble}
      transparent
      animationType="none"
      onRequestClose={hideBubbleMenu}
    >
      <TouchableWithoutFeedback onPress={hideBubbleMenu}>
        <View style={styles.bubbleOverlay}>
          <Animated.View
            style={[
              styles.bubbleContainer,
              {
                transform: [
                  { scale: scaleAnimation },
                  {
                    translateY: bubbleAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
                opacity: bubbleAnimation,
              },
            ]}
          >
            <BlurView
              intensity={TAB_BAR_THEME.blur.bubble.intensity}
              tint={TAB_BAR_THEME.blur.bubble.tint as any}
              style={styles.bubbleContent}
            >
              <View style={styles.bubbleArrow} />
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.bubbleItem,
                    index === quickActions.length - 1 && styles.bubbleItemLast
                  ]}
                  onPress={() => {
                    if (Platform.OS === 'ios') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    }
                    handleQuickAction(action.route)
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.bubbleItemIcon, { backgroundColor: action.color + '15' }]}>
                    <Ionicons name={action.icon} size={TAB_BAR_THEME.dimensions.bubbleActionIconSize} color={action.color} />
                  </View>
                  <View style={styles.bubbleItemContent}>
                    <Text style={styles.bubbleItemTitle}>{action.title}</Text>
                    <Text style={styles.bubbleItemDescription}>{action.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </BlurView>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )

  return (
    <>
      <Animated.View
        style={[
          styles.tabBar,
          {
            opacity: tabBarOpacity,
            transform: [{ translateY: tabBarTranslateY }],
          }
        ]}
      >
        <BlurView
          intensity={TAB_BAR_THEME.blur.tabBar.intensity}
          tint={TAB_BAR_THEME.blur.tabBar.tint as any}
          style={styles.tabBarBlur}
        >
          <View style={styles.tabBarContent}>
            {/* Left tabs */}
            <View style={styles.tabSection}>
              {tabs.slice(0, 3).map((tab, index) => renderTabButton(tab, index))}
            </View>

            {/* Plus button */}
            {renderPlusButton()}

            {/* Right tabs */}
            <View style={styles.tabSection}>
              {tabs.slice(3).map((tab, index) => renderTabButton(tab, index + 3))}
            </View>
          </View>
        </BlurView>
      </Animated.View>

      {renderBubbleMenu()}
    </>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 95 : 75,
    backgroundColor: 'transparent',
  },
  tabBarBlur: {
    flex: 1,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.15,
    shadowRadius: 25,
    elevation: 30,
    overflow: 'hidden',
    ...(Platform.OS === 'ios' && {
      borderTopWidth: 0.5,
      borderTopColor: 'rgba(255, 255, 255, 0.8)',
    }),
  },
  tabBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
  },
  tabSection: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 16,
    minWidth: 52,
    maxWidth: 64,
  },
  tabIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginBottom: 2,
  },
  tabIconContainerActive: {
    backgroundColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8e8e93',
    marginTop: 2,
    letterSpacing: 0,
    textAlign: 'center',
    width: '100%',
  },
  tabLabelActive: {
    color: '#667eea',
    fontWeight: '700',
    fontSize: 10,
  },
  // Plus Button Styles
  plusButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 18,
    marginHorizontal: 12,
    marginTop: -10,
    borderWidth: 4,
    borderColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.95)',
  },
  plusButtonInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Bubble Menu Styles
  bubbleOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bubbleContainer: {
    marginBottom: Platform.OS === 'ios' ? 180 : 160,
    alignItems: 'center',
  },
  bubbleContent: {
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.98)',
    borderRadius: 28,
    paddingVertical: 20,
    paddingHorizontal: 8,
    minWidth: 300,
    maxWidth: 320,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 24,
    overflow: 'hidden',
    ...(Platform.OS === 'ios' && {
      borderWidth: 0.5,
      borderColor: 'rgba(255, 255, 255, 0.9)',
    }),
  },
  bubbleArrow: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    transform: [{ rotate: '45deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  bubbleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 16,
    marginHorizontal: 8,
    marginVertical: 2,
  },
  bubbleItemLast: {
    borderBottomWidth: 0,
    marginBottom: 8,
  },
  bubbleItemIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  bubbleItemContent: {
    flex: 1,
  },
  bubbleItemTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  bubbleItemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
})
