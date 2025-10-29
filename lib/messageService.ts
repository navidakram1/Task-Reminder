import { supabase } from './supabase'

export interface Message {
  id: string
  household_id: string
  user_id: string
  message_type: 'message' | 'activity' | 'note'
  content: string
  is_pinned: boolean
  is_edited: boolean
  edited_at?: string
  created_at: string
  user_name: string
  user_photo?: string
  user_email: string
  reaction_count?: number
  read_count?: number
}

export interface Activity {
  id: string
  household_id: string
  user_id: string
  activity_type: string
  activity_description: string
  created_at: string
  user_name: string
  user_photo?: string
  user_email: string
}

export class MessageService {
  /**
   * Send a message to a household
   */
  static async sendMessage(
    householdId: string,
    content: string,
    messageType: 'message' | 'note' = 'message'
  ) {
    try {
      const { data, error } = await supabase.from('household_messages').insert({
        household_id: householdId,
        content,
        message_type: messageType,
      })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error sending message:', error)
      return { success: false, error }
    }
  }

  /**
   * Get messages for a household
   */
  static async getMessages(householdId: string, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('household_messages_with_users')
        .select('*')
        .eq('household_id', householdId)
        .eq('message_type', 'message')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error fetching messages:', error)
      return { success: false, error, data: [] }
    }
  }

  /**
   * Get activities for a household
   */
  static async getActivities(householdId: string, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('household_activities_with_users')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error fetching activities:', error)
      return { success: false, error, data: [] }
    }
  }

  /**
   * Get notes for a household
   */
  static async getNotes(householdId: string, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('household_messages_with_users')
        .select('*')
        .eq('household_id', householdId)
        .eq('message_type', 'note')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error fetching notes:', error)
      return { success: false, error, data: [] }
    }
  }

  /**
   * Get unread message count for a household
   */
  static async getUnreadCount(householdId: string) {
    try {
      const { data, error } = await supabase.rpc('get_unread_message_count', {
        p_household_id: householdId,
      })

      if (error) throw error
      return { success: true, count: data || 0 }
    } catch (error) {
      console.error('Error fetching unread count:', error)
      return { success: false, error, count: 0 }
    }
  }

  /**
   * Mark a message as read
   */
  static async markAsRead(messageId: string) {
    try {
      const { data, error } = await supabase.from('message_read_status').insert({
        message_id: messageId,
      })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error marking message as read:', error)
      return { success: false, error }
    }
  }

  /**
   * Add a reaction to a message
   */
  static async addReaction(messageId: string, emoji: string) {
    try {
      const { data, error } = await supabase.from('message_reactions').insert({
        message_id: messageId,
        reaction_emoji: emoji,
      })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error adding reaction:', error)
      return { success: false, error }
    }
  }

  /**
   * Remove a reaction from a message
   */
  static async removeReaction(messageId: string, emoji: string) {
    try {
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('reaction_emoji', emoji)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error removing reaction:', error)
      return { success: false, error }
    }
  }

  /**
   * Edit a message
   */
  static async editMessage(messageId: string, newContent: string) {
    try {
      const { data, error } = await supabase
        .from('household_messages')
        .update({
          content: newContent,
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId)

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error editing message:', error)
      return { success: false, error }
    }
  }

  /**
   * Delete a message
   */
  static async deleteMessage(messageId: string) {
    try {
      const { error } = await supabase
        .from('household_messages')
        .delete()
        .eq('id', messageId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error deleting message:', error)
      return { success: false, error }
    }
  }

  /**
   * Pin a message
   */
  static async pinMessage(messageId: string) {
    try {
      const { data, error } = await supabase
        .from('household_messages')
        .update({ is_pinned: true })
        .eq('id', messageId)

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error pinning message:', error)
      return { success: false, error }
    }
  }

  /**
   * Unpin a message
   */
  static async unpinMessage(messageId: string) {
    try {
      const { data, error } = await supabase
        .from('household_messages')
        .update({ is_pinned: false })
        .eq('id', messageId)

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error unpinning message:', error)
      return { success: false, error }
    }
  }

  /**
   * Subscribe to real-time message updates
   */
  static subscribeToMessages(householdId: string, callback: () => void) {
    const subscription = supabase
      .channel(`messages:${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'household_messages',
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          callback()
        }
      )
      .subscribe()

    return subscription
  }

  /**
   * Subscribe to activity updates
   */
  static subscribeToActivities(householdId: string, callback: () => void) {
    const subscription = supabase
      .channel(`activities:${householdId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'household_activities',
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          callback()
        }
      )
      .subscribe()

    return subscription
  }
}

