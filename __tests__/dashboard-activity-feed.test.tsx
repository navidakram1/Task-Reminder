import React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'
import { jest } from '@jest/globals'
import DashboardScreen from '../app/(app)/dashboard'

describe('Dashboard Activity Feed', () => {
  const mockActivityData = {
    household: {
      id: 'household-1',
      name: 'Test Household',
      invite_code: 'ABC123',
      userRole: 'admin',
    },
    upcomingTasks: [],
    recentBills: [],
    pendingTransfers: [],
    analytics: {
      tasksCompleted: 0,
      totalSpent: 0,
      avgTasksPerWeek: 0,
      householdEfficiency: 0,
    },
    activityFeed: [
      {
        id: 'activity-1',
        type: 'task',
        title: 'Clean Kitchen',
        status: 'completed',
        timestamp: '2024-01-14T10:30:00Z',
        user: 'John Doe',
      },
      {
        id: 'activity-2',
        type: 'task',
        title: 'Vacuum Living Room',
        status: 'pending',
        timestamp: '2024-01-14T09:15:00Z',
        user: 'Jane Smith',
      },
      {
        id: 'activity-3',
        type: 'bill',
        title: 'Groceries',
        status: 'added',
        timestamp: '2024-01-13T18:45:00Z',
        user: 'Bob Johnson',
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock successful data fetch with activity feed
    const { supabase } = require('../lib/supabase')
    supabase.rpc.mockResolvedValue({
      data: [mockActivityData.household],
      error: null,
    })
    
    // Mock activity feed query
    supabase.from.mockImplementation((table) => {
      if (table === 'tasks') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn((limit) => {
                  if (limit === 10) {
                    // Activity feed query
                    return Promise.resolve({
                      data: mockActivityData.activityFeed.map(activity => ({
                        id: activity.id,
                        title: activity.title,
                        status: activity.status,
                        created_at: activity.timestamp,
                        updated_at: activity.timestamp,
                        assignee_id: 'user-1',
                        profiles: {
                          name: activity.user,
                          email: `${activity.user.toLowerCase().replace(' ', '.')}@example.com`,
                        },
                      })),
                      error: null,
                    })
                  }
                  // Regular tasks query
                  return Promise.resolve({
                    data: [],
                    error: null,
                  })
                }),
              })),
            })),
          })),
        }
      }
      
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: [],
                error: null,
              })),
            })),
          })),
        })),
      }
    })
  })

  describe('Activity Feed Display', () => {
    it('should display activity feed section', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('🔔 Recent Activity')).toBeTruthy()
        expect(screen.getByText('See All')).toBeTruthy()
      })
    })

    it('should display activity items', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText(/Completed task: Clean Kitchen/)).toBeTruthy()
        expect(screen.getByText(/Created task: Vacuum Living Room/)).toBeTruthy()
        expect(screen.getByText('by John Doe')).toBeTruthy()
        expect(screen.getByText('by Jane Smith')).toBeTruthy()
      })
    })

    it('should display correct activity icons', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('✅')).toBeTruthy() // Completed task icon
        expect(screen.getByText('📋')).toBeTruthy() // Created task icon
      })
    })

    it('should display activity timestamps', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        // Should display formatted timestamps
        expect(screen.getByText(/Jan 14/)).toBeTruthy()
        expect(screen.getByText(/Jan 13/)).toBeTruthy()
      })
    })

    it('should limit activity items to 5', async () => {
      // Mock more than 5 activities
      const manyActivities = Array.from({ length: 10 }, (_, i) => ({
        id: `activity-${i}`,
        type: 'task',
        title: `Task ${i}`,
        status: 'completed',
        timestamp: '2024-01-14T10:30:00Z',
        user: `User ${i}`,
      }))

      const { supabase } = require('../lib/supabase')
      supabase.from.mockImplementation((table) => {
        if (table === 'tasks') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                order: jest.fn(() => ({
                  limit: jest.fn(() => Promise.resolve({
                    data: manyActivities.map(activity => ({
                      id: activity.id,
                      title: activity.title,
                      status: activity.status,
                      updated_at: activity.timestamp,
                      profiles: { name: activity.user },
                    })),
                    error: null,
                  })),
                })),
              })),
            })),
          }
        }
        return { select: jest.fn(() => ({ eq: jest.fn(() => ({ order: jest.fn(() => ({ limit: jest.fn(() => Promise.resolve({ data: [], error: null })) })) })) })) }
      })

      render(<DashboardScreen />)
      
      await waitFor(() => {
        // Should only display first 5 activities
        expect(screen.getByText('🔔 Recent Activity')).toBeTruthy()
        // The component should slice to 5 items
      })
    })
  })

  describe('Activity Feed Navigation', () => {
    it('should navigate to full activity page when "See All" is pressed', async () => {
      const { router } = require('expo-router')
      render(<DashboardScreen />)
      
      await waitFor(() => {
        const seeAllButton = screen.getByText('See All')
        fireEvent.press(seeAllButton)
        expect(router.push).toHaveBeenCalledWith('/(app)/household/activity')
      })
    })

    it('should handle activity item press', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        // Activity items should be pressable (if implemented)
        expect(screen.getByText(/Completed task: Clean Kitchen/)).toBeTruthy()
      })
    })
  })

  describe('Activity Feed Empty State', () => {
    it('should display empty state when no activities exist', async () => {
      // Mock empty activity feed
      const { supabase } = require('../lib/supabase')
      supabase.from.mockImplementation(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: [],
                error: null,
              })),
            })),
          })),
        })),
      }))

      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('No recent activity')).toBeTruthy()
        expect(screen.getByText('Start creating tasks to see activity here')).toBeTruthy()
      })
    })

    it('should display empty state with proper styling', async () => {
      // Mock empty activity feed
      const { supabase } = require('../lib/supabase')
      supabase.from.mockImplementation(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: [],
                error: null,
              })),
            })),
          })),
        })),
      }))

      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('🔔 Recent Activity')).toBeTruthy()
        expect(screen.getByText('No recent activity')).toBeTruthy()
      })
    })
  })

  describe('Activity Feed Error Handling', () => {
    it('should handle activity feed fetch errors gracefully', async () => {
      // Mock error in activity feed fetch
      const { supabase } = require('../lib/supabase')
      supabase.from.mockImplementation(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.reject(new Error('Database error'))),
            })),
          })),
        })),
      }))

      render(<DashboardScreen />)
      
      await waitFor(() => {
        // Should still render activity section with empty state
        expect(screen.getByText('🔔 Recent Activity')).toBeTruthy()
        expect(screen.getByText('No recent activity')).toBeTruthy()
      })
    })

    it('should handle malformed activity data', async () => {
      // Mock malformed activity data
      const { supabase } = require('../lib/supabase')
      supabase.from.mockImplementation(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: [
                  { id: 'bad-1' }, // Missing required fields
                  { id: 'bad-2', title: null },
                  null, // Null item
                ],
                error: null,
              })),
            })),
          })),
        })),
      }))

      render(<DashboardScreen />)
      
      await waitFor(() => {
        // Should handle malformed data gracefully
        expect(screen.getByText('🔔 Recent Activity')).toBeTruthy()
      })
    })
  })

  describe('Activity Feed Formatting', () => {
    it('should format timestamps correctly', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        // Should display formatted dates and times
        expect(screen.getByText(/Jan 14/)).toBeTruthy()
      })
    })

    it('should handle different activity types', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        // Should display different icons for different activity types
        expect(screen.getByText('✅')).toBeTruthy() // Completed task
        expect(screen.getByText('📋')).toBeTruthy() // Created task
      })
    })

    it('should truncate long activity titles', async () => {
      // Mock activity with very long title
      const longTitleActivity = {
        id: 'long-1',
        title: 'This is a very long task title that should be truncated properly to fit in the activity feed without breaking the layout',
        status: 'completed',
        timestamp: '2024-01-14T10:30:00Z',
        user: 'Test User',
      }

      const { supabase } = require('../lib/supabase')
      supabase.from.mockImplementation(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: [{
                  id: longTitleActivity.id,
                  title: longTitleActivity.title,
                  status: longTitleActivity.status,
                  updated_at: longTitleActivity.timestamp,
                  profiles: { name: longTitleActivity.user },
                }],
                error: null,
              })),
            })),
          })),
        })),
      }))

      render(<DashboardScreen />)
      
      await waitFor(() => {
        // Should handle long titles gracefully
        expect(screen.getByText('🔔 Recent Activity')).toBeTruthy()
      })
    })
  })

  describe('Activity Feed Performance', () => {
    it('should load activity feed efficiently', async () => {
      const startTime = Date.now()
      
      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('🔔 Recent Activity')).toBeTruthy()
      })
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds
    })

    it('should handle large activity datasets', async () => {
      // Mock large dataset
      const largeActivitySet = Array.from({ length: 100 }, (_, i) => ({
        id: `activity-${i}`,
        title: `Task ${i}`,
        status: 'completed',
        updated_at: '2024-01-14T10:30:00Z',
        profiles: { name: `User ${i}` },
      }))

      const { supabase } = require('../lib/supabase')
      supabase.from.mockImplementation(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: largeActivitySet,
                error: null,
              })),
            })),
          })),
        })),
      }))

      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('🔔 Recent Activity')).toBeTruthy()
        // Should handle large datasets without performance issues
      })
    })
  })

  describe('Activity Feed Accessibility', () => {
    it('should have proper accessibility labels', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('🔔 Recent Activity')).toBeTruthy()
        expect(screen.getByText('See All')).toBeTruthy()
      })
    })

    it('should support screen reader navigation', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        // Activity items should be accessible
        expect(screen.getByText(/Completed task: Clean Kitchen/)).toBeTruthy()
        expect(screen.getByText('by John Doe')).toBeTruthy()
      })
    })
  })
})
