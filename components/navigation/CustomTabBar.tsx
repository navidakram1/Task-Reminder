import { BlurView } from 'expo-blur'
import { router } from 'expo-router'
import { useRef, useState } from 'react'
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
  emoji: string
  route: string
}

interface QuickAction {
  title: string
  emoji: string
  route: string
  description: string
}

const tabs: TabItem[] = [
  { name: 'dashboard', title: 'Home', emoji: '🏠', route: '/(app)/dashboard' },
  { name: 'tasks', title: 'Tasks', emoji: '✅', route: '/(app)/tasks' },
  { name: 'bills', title: 'Bills', emoji: '💰', route: '/(app)/bills' },
  { name: 'review', title: 'Review', emoji: '⭐', route: '/(app)/approvals' },
  { name: 'proposals', title: 'Proposals', emoji: '📋', route: '/(app)/proposals' },
  { name: 'settings', title: 'Settings', emoji: '⚙️', route: '/(app)/settings' },
]

const quickActions: QuickAction[] = [
  {
    title: 'New Task',
    emoji: '✅',
    route: '/(app)/tasks/create',
    description: 'Create a new task'
  },
  {
    title: 'Add Bill',
    emoji: '💰',
    route: '/(app)/bills/create',
    description: 'Split a new bill'
  },
  {
    title: 'New Proposal',
    emoji: '📋',
    route: '/(app)/proposals/create',
    description: 'Create a proposal'
  },
  {
    title: 'Add Review',
    emoji: '⭐',
    route: '/(app)/approvals/create',
    description: 'Submit for review'
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

    return (
      <TouchableOpacity
        key={tab.name}
        style={styles.tabButton}
        onPress={() => {
          if (!isFocused) {
            router.push(tab.route as any)
          }
        }}
        activeOpacity={0.7}
      >
        <View style={[
          styles.tabIconContainer,
          isFocused && styles.tabIconContainerActive
        ]}>
          <Text style={[
            styles.tabIcon,
            isFocused && styles.tabIconActive
          ]}>
            {tab.emoji}
          </Text>
        </View>
        <Text style={[
          styles.tabLabel,
          isFocused && styles.tabLabelActive
        ]}>
          {tab.title}
        </Text>
      </TouchableOpacity>
    )
  }

  const renderPlusButton = () => (
    <TouchableOpacity
      style={styles.plusButton}
      onPress={showBubbleMenu}
      activeOpacity={0.8}
    >
      <View style={styles.plusButtonInner}>
        <Text style={styles.plusIcon}>+</Text>
      </View>
    </TouchableOpacity>
  )

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
            <BlurView intensity={20} style={styles.bubbleContent}>
              <View style={styles.bubbleArrow} />
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.bubbleItem,
                    index === quickActions.length - 1 && styles.bubbleItemLast
                  ]}
                  onPress={() => handleQuickAction(action.route)}
                  activeOpacity={0.7}
                >
                  <View style={styles.bubbleItemIcon}>
                    <Text style={styles.bubbleItemEmoji}>{action.emoji}</Text>
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
      <View style={styles.tabBar}>
        <BlurView intensity={20} style={styles.tabBarBlur}>
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
      </View>

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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 30,
  },
  tabBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
  },
  tabSection: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 20,
    minWidth: 56,
    flex: 1,
    maxWidth: 80,
  },
  tabIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginBottom: 6,
    transition: 'all 0.2s ease',
  },
  tabIconContainerActive: {
    backgroundColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
    transform: [{ scale: 1.05 }],
  },
  tabIcon: {
    fontSize: 20,
    color: '#8e8e93',
  },
  tabIconActive: {
    fontSize: 22,
    color: '#ffffff',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8e8e93',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#667eea',
    fontWeight: '700',
  },
  // Plus Button Styles
  plusButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 20,
    marginHorizontal: 16,
    marginTop: -12,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  plusButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  plusIcon: {
    fontSize: 32,
    fontWeight: '200',
    color: '#ffffff',
    lineHeight: 32,
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
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 8,
    minWidth: 300,
    maxWidth: 320,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  bubbleItemEmoji: {
    fontSize: 22,
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
