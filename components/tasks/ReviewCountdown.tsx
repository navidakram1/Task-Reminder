import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface ReviewCountdownProps {
  pendingReviewSince: string | null
  compact?: boolean
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalSeconds: number
  isExpired: boolean
}

const REVIEW_DURATION_DAYS = 3
const REVIEW_DURATION_MS = REVIEW_DURATION_DAYS * 24 * 60 * 60 * 1000

export default function ReviewCountdown({ pendingReviewSince, compact = false }: ReviewCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null)

  const calculateTimeRemaining = (): TimeRemaining => {
    if (!pendingReviewSince) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        isExpired: true,
      }
    }

    const reviewStartTime = new Date(pendingReviewSince).getTime()
    const autoApprovalTime = reviewStartTime + REVIEW_DURATION_MS
    const now = Date.now()
    const diff = autoApprovalTime - now

    if (diff <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        isExpired: true,
      }
    }

    const totalSeconds = Math.floor(diff / 1000)
    const days = Math.floor(totalSeconds / (24 * 60 * 60))
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
    const seconds = totalSeconds % 60

    return {
      days,
      hours,
      minutes,
      seconds,
      totalSeconds,
      isExpired: false,
    }
  }

  useEffect(() => {
    // Initial calculation
    setTimeRemaining(calculateTimeRemaining())

    // Update every minute (or every second if you want real-time updates)
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [pendingReviewSince])

  if (!timeRemaining || !pendingReviewSince) {
    return null
  }

  if (timeRemaining.isExpired) {
    return (
      <View style={[styles.container, styles.expiredContainer]}>
        <Ionicons name="checkmark-circle" size={14} color="#10b981" />
        <Text style={[styles.text, styles.expiredText]}>Auto-approving...</Text>
      </View>
    )
  }

  // Determine urgency color
  const getUrgencyColor = () => {
    const hoursRemaining = timeRemaining.totalSeconds / 3600
    if (hoursRemaining > 48) return '#10b981' // Green (>2 days)
    if (hoursRemaining > 24) return '#f59e0b' // Yellow (1-2 days)
    return '#f97316' // Orange (<1 day)
  }

  const urgencyColor = getUrgencyColor()

  // Format countdown text
  const formatCountdown = () => {
    if (compact) {
      if (timeRemaining.days > 0) {
        return `${timeRemaining.days}d ${timeRemaining.hours}h`
      }
      if (timeRemaining.hours > 0) {
        return `${timeRemaining.hours}h ${timeRemaining.minutes}m`
      }
      return `${timeRemaining.minutes}m`
    }

    const parts = []
    if (timeRemaining.days > 0) parts.push(`${timeRemaining.days}d`)
    if (timeRemaining.hours > 0) parts.push(`${timeRemaining.hours}h`)
    if (timeRemaining.minutes > 0 || parts.length === 0) parts.push(`${timeRemaining.minutes}m`)
    return parts.join(' ')
  }

  return (
    <View style={[styles.container, { backgroundColor: urgencyColor + '15' }]}>
      <Ionicons name="time-outline" size={14} color={urgencyColor} />
      <Text style={[styles.text, { color: urgencyColor }]}>
        {compact ? formatCountdown() : `Auto-approves in: ${formatCountdown()}`}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  expiredContainer: {
    backgroundColor: '#10b98115',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
  expiredText: {
    color: '#10b981',
  },
})

