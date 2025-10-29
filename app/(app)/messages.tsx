import React, { useEffect, useRef, useState } from 'react'
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

interface Message {
  id: string
  household_id: string
  user_id: string
  message_type: 'message' | 'activity' | 'note'
  content: string
  is_pinned: boolean
  is_edited: boolean
  created_at: string
  user_name: string
  user_photo: string
  user_email: string
}

interface Activity {
  id: string
  household_id: string
  user_id: string
  activity_type: string
  activity_description: string
  created_at: string
  user_name: string
  user_photo: string
}

export default function MessagesScreen() {
  const { user } = useAuth()
  const [currentHousehold, setCurrentHousehold] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'messages' | 'activities' | 'notes'>('messages')
  const [messages, setMessages] = useState<Message[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [notes, setNotes] = useState<Message[]>([])
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollViewRef = useRef<ScrollView>(null)

  // Animation values
  const slideAnim = useRef(new Animated.Value(500)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const tabFadeAnim = useRef(new Animated.Value(1)).current
  const sendScaleAnim = useRef(new Animated.Value(1)).current

  // Animate screen on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  // Fetch the active household for the user
  useEffect(() => {
    if (user?.id) {
      fetchActiveHousehold()
    }
  }, [user?.id])

  const fetchActiveHousehold = async () => {
    try {
      if (!user?.id) {
        console.warn('User ID not available')
        return
      }

      const { data, error } = await supabase
        .from('household_members')
        .select('household_id, households(id, name, invite_code)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching active household:', error.message)
        return
      }

      if (data?.households) {
        setCurrentHousehold(data.households)
      }
    } catch (error: any) {
      console.error('Error fetching active household:', error?.message || error)
    }
  }

  // Handle tab switching with animation
  const handleTabChange = (tab: 'messages' | 'activities' | 'notes') => {
    Animated.sequence([
      Animated.timing(tabFadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(tabFadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start()

    setActiveTab(tab)
  }

  useEffect(() => {
    if (currentHousehold?.id) {
      fetchMessages()
      fetchActivities()
      fetchNotes()
      subscribeToMessages()
    }
  }, [currentHousehold?.id])

  const fetchMessages = async () => {
    try {
      if (!currentHousehold?.id) {
        console.warn('Cannot fetch messages: household ID not available')
        return
      }

      const { data, error } = await supabase
        .from('household_messages_with_users')
        .select('*')
        .eq('household_id', currentHousehold.id)
        .eq('message_type', 'message')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching messages:', error.message)
        throw error
      }

      setMessages(data || [])
    } catch (error: any) {
      console.error('Error fetching messages:', error?.message || error)
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async () => {
    try {
      if (!currentHousehold?.id) {
        console.warn('Cannot fetch activities: household ID not available')
        return
      }

      const { data, error } = await supabase
        .from('household_activities_with_users')
        .select('*')
        .eq('household_id', currentHousehold.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching activities:', error.message)
        throw error
      }

      setActivities(data || [])
    } catch (error: any) {
      console.error('Error fetching activities:', error?.message || error)
    }
  }

  const fetchNotes = async () => {
    try {
      if (!currentHousehold?.id) {
        console.warn('Cannot fetch notes: household ID not available')
        return
      }

      const { data, error } = await supabase
        .from('household_messages_with_users')
        .select('*')
        .eq('household_id', currentHousehold.id)
        .eq('message_type', 'note')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching notes:', error.message)
        throw error
      }

      setNotes(data || [])
    } catch (error: any) {
      console.error('Error fetching notes:', error?.message || error)
    }
  }

  const subscribeToMessages = () => {
    if (!currentHousehold?.id) {
      console.warn('Cannot subscribe to messages: household ID not available')
      return () => {}
    }

    try {
      const subscription = supabase
        .channel(`messages:${currentHousehold.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'household_messages',
            filter: `household_id=eq.${currentHousehold.id}`,
          },
          (payload) => {
            try {
              fetchMessages()
              fetchActivities()
              fetchNotes()
            } catch (error: any) {
              console.error('Error in subscription callback:', error?.message || error)
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Subscribed to messages channel')
          } else if (status === 'CLOSED') {
            console.log('Unsubscribed from messages channel')
          }
        })

      return () => {
        subscription.unsubscribe()
      }
    } catch (error: any) {
      console.error('Error subscribing to messages:', error?.message || error)
      return () => {}
    }
  }

  const sendMessage = async () => {
    if (!messageText.trim() || !currentHousehold?.id) {
      console.warn('Cannot send message: missing text or household')
      return
    }

    if (!user?.id) {
      console.error('Cannot send message: user not authenticated')
      return
    }

    setSending(true)
    try {
      // Animate send button
      Animated.sequence([
        Animated.timing(sendScaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(sendScaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start()

      const { error } = await supabase.from('household_messages').insert({
        household_id: currentHousehold.id,
        user_id: user.id,
        content: messageText.trim(),
        message_type: activeTab === 'notes' ? 'note' : 'message',
      })

      if (error) {
        console.error('Error sending message:', error.message)
        throw error
      }

      setMessageText('')

      // Show success animation
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()

      // Refresh messages
      await Promise.all([fetchMessages(), fetchNotes()])
    } catch (error: any) {
      console.error('Error sending message:', error?.message || error)
    } finally {
      setSending(false)
    }
  }

  const renderMessage = (item: Message) => (
    <View key={item.id} style={styles.messageItem}>
      <View style={styles.messageAvatar}>
        {item.user_photo ? (
          <Image source={{ uri: item.user_photo }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.user_name?.charAt(0).toUpperCase() || '👤'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={styles.messageName}>{item.user_name}</Text>
          <Text style={styles.messageTime}>
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <Text style={styles.messageText}>{item.content}</Text>
        {item.is_edited && <Text style={styles.editedLabel}>(edited)</Text>}
      </View>
    </View>
  )

  const renderActivity = (item: Activity) => (
    <View key={item.id} style={styles.activityItem}>
      <View style={styles.activityAvatar}>
        {item.user_photo ? (
          <Image source={{ uri: item.user_photo }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.user_name?.charAt(0).toUpperCase() || '👤'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.activityContent}>
        <Text style={styles.activityText}>
          <Text style={styles.activityName}>{item.user_name}</Text>
          {' ' + item.activity_description}
        </Text>
        <Text style={styles.activityTime}>
          {new Date(item.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  )

  const currentData =
    activeTab === 'messages' ? messages : activeTab === 'activities' ? activities : notes

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Household Chat</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {(['messages', 'activities', 'notes'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => handleTabChange(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.tabTextActive,
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Messages List */}
          <Animated.View style={[styles.flex, { opacity: tabFadeAnim }]}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
              </View>
            ) : (
              <FlatList
                ref={scrollViewRef}
                data={currentData}
                renderItem={({ item }) =>
                  activeTab === 'activities' ? renderActivity(item as Activity) : renderMessage(item)
                }
                keyExtractor={(item) => item.id}
                inverted
                scrollEnabled={true}
                style={styles.messagesList}
                contentContainerStyle={styles.messagesListContent}
              />
            )}
          </Animated.View>

          {/* Message Input */}
          {activeTab !== 'activities' && (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={`Send a ${activeTab === 'notes' ? 'note' : 'message'}...`}
                placeholderTextColor="#999"
                value={messageText}
                onChangeText={setMessageText}
                multiline
                maxLength={500}
              />
              <Animated.View
                style={{
                  transform: [{ scale: sendScaleAnim }],
                }}
              >
                <TouchableOpacity
                  style={[styles.sendButton, sending && styles.sendButtonDisabled]}
                  onPress={sendMessage}
                  disabled={sending || !messageText.trim()}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.sendButtonText}>Send</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          )}

          {/* Success Animation */}
          <Animated.View
            style={[
              styles.successMessage,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <Text style={styles.successText}>✓ Message sent!</Text>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  tabActive: {
    backgroundColor: '#FF6B6B',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    flex: 1,
  },
  messagesListContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  messageAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  messageContent: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  editedLabel: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  activityAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  activityName: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  activityTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1a1a1a',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  successMessage: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  successText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
})

