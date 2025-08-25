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
  { name: 'vote', title: 'Vote', emoji: '🗳️', route: '/(app)/proposals' },
  { name: 'review', title: 'Review', emoji: '⭐', route: '/(app)/approvals' },
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
    title: 'Start Vote',
    emoji: '🗳️',
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
              {tabs.slice(0, 2).map((tab, index) => renderTabButton(tab, index))}
            </View>

            {/* Plus button */}
            {renderPlusButton()}

            {/* Right tabs */}
            <View style={styles.tabSection}>
              {tabs.slice(2).map((tab, index) => renderTabButton(tab, index + 2))}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
  },
  tabSection: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    minWidth: 60,
  },
  tabIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  tabIconContainerActive: {
    backgroundColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
    marginHorizontal: 20,
    marginTop: -10,
  },
  plusButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  plusIcon: {
    fontSize: 28,
    fontWeight: '300',
    color: '#ffffff',
    lineHeight: 28,
  },
  // Bubble Menu Styles
  bubbleOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bubbleContainer: {
    marginBottom: Platform.OS === 'ios' ? 170 : 150,
    alignItems: 'center',
  },
  bubbleContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 4,
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  bubbleItemLast: {
    borderBottomWidth: 0,
  },
  bubbleItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  bubbleItemEmoji: {
    fontSize: 20,
  },
  bubbleItemContent: {
    flex: 1,
  },
  bubbleItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  bubbleItemDescription: {
    fontSize: 13,
    color: '#666',
  },
})
