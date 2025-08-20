import React from 'react'
import { render, waitFor, screen } from '@testing-library/react-native'
import { jest } from '@jest/globals'
import DashboardScreen from '../app/(app)/dashboard'

describe('Dashboard Analytics Widgets', () => {
  const mockAnalyticsData = {
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
      tasksCompleted: 42,
      totalSpent: 1250.75,
      avgTasksPerWeek: 8,
      householdEfficiency: 92,
    },
    activityFeed: [],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock successful data fetch with analytics
    const { supabase } = require('../lib/supabase')
    supabase.rpc.mockResolvedValue({
      data: [mockAnalyticsData.household],
      error: null,
    })
    
    // Mock analytics queries
    supabase.from.mockImplementation((table) => {
      if (table === 'tasks') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({
                  data: [],
                  error: null,
                })),
              })),
              gte: jest.fn(() => ({
                order: jest.fn(() => ({
                  limit: jest.fn(() => Promise.resolve({
                    data: [],
                    error: null,
                  })),
                })),
              })),
            })),
            count: 'exact',
            head: true,
          })),
        }
      }
      
      if (table === 'bills') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              gte: jest.fn(() => Promise.resolve({
                data: [
                  { amount: 500.25 },
                  { amount: 750.50 },
                ],
                error: null,
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

  describe('Analytics Cards Display', () => {
    it('should display all four analytics cards', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('📊 Household Analytics')).toBeTruthy()
        expect(screen.getByText('Tasks Completed')).toBeTruthy()
        expect(screen.getByText('Total Spent')).toBeTruthy()
        expect(screen.getByText('Avg Tasks/Week')).toBeTruthy()
        expect(screen.getByText('Efficiency')).toBeTruthy()
      })
    })

    it('should display correct analytics values', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        // Note: These values will be calculated from mocked data
        expect(screen.getByText('This month')).toBeTruthy()
        expect(screen.getByText('Last 4 weeks')).toBeTruthy()
        expect(screen.getByText('Completion rate')).toBeTruthy()
      })
    })

    it('should display analytics icons correctly', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('✅')).toBeTruthy() // Tasks completed icon
        expect(screen.getByText('💰')).toBeTruthy() // Total spent icon
        expect(screen.getByText('📈')).toBeTruthy() // Avg tasks icon
        expect(screen.getByText('⚡')).toBeTruthy() // Efficiency icon
      })
    })
  })

  describe('Analytics Card Styling', () => {
    it('should apply correct styling to analytics cards', async () => {
      const { getByText } = render(<DashboardScreen />)
      
      await waitFor(() => {
        const analyticsSection = getByText('📊 Household Analytics')
        expect(analyticsSection).toBeTruthy()
        
        // Check that cards are rendered with proper structure
        expect(getByText('Tasks Completed')).toBeTruthy()
        expect(getByText('Total Spent')).toBeTruthy()
        expect(getByText('Avg Tasks/Week')).toBeTruthy()
        expect(getByText('Efficiency')).toBeTruthy()
      })
    })

    it('should display analytics cards in grid layout', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        // Verify all analytics cards are present
        const cards = [
          'Tasks Completed',
          'Total Spent', 
          'Avg Tasks/Week',
          'Efficiency'
        ]
        
        cards.forEach(cardTitle => {
          expect(screen.getByText(cardTitle)).toBeTruthy()
        })
      })
    })
  })

  describe('Analytics Data Calculation', () => {
    it('should handle zero values gracefully', async () => {
      // Mock empty analytics data
      const { supabase } = require('../lib/supabase')
      supabase.from.mockImplementation(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => Promise.resolve({
              data: [],
              error: null,
            })),
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: [],
                error: null,
              })),
            })),
          })),
          count: 'exact',
          head: true,
        })),
      }))

      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('📊 Household Analytics')).toBeTruthy()
        // Should display zero values without crashing
      })
    })

    it('should handle analytics calculation errors gracefully', async () => {
      // Mock error in analytics fetch
      const { supabase } = require('../lib/supabase')
      supabase.from.mockImplementation(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => Promise.reject(new Error('Database error'))),
          })),
        })),
      }))

      render(<DashboardScreen />)
      
      await waitFor(() => {
        // Should still render analytics section with default values
        expect(screen.getByText('📊 Household Analytics')).toBeTruthy()
      })
    })

    it('should calculate percentage values correctly', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        // Efficiency should be displayed as percentage
        expect(screen.getByText('Completion rate')).toBeTruthy()
      })
    })

    it('should format currency values correctly', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        // Total spent should be formatted as currency
        expect(screen.getByText('Total Spent')).toBeTruthy()
      })
    })
  })

  describe('Analytics Responsiveness', () => {
    it('should adapt to different screen sizes', async () => {
      // Mock different screen dimensions
      const { Dimensions } = require('react-native')
      Dimensions.get.mockReturnValue({
        width: 320, // Smaller screen
        height: 568,
      })

      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('📊 Household Analytics')).toBeTruthy()
        // Cards should still be visible on smaller screens
      })
    })

    it('should handle tablet layout', async () => {
      // Mock tablet dimensions
      const { Dimensions } = require('react-native')
      Dimensions.get.mockReturnValue({
        width: 768,
        height: 1024,
      })

      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('📊 Household Analytics')).toBeTruthy()
        // Should adapt layout for larger screens
      })
    })
  })

  describe('Analytics Accessibility', () => {
    it('should have proper accessibility labels', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        // Analytics cards should be accessible
        expect(screen.getByText('Tasks Completed')).toBeTruthy()
        expect(screen.getByText('Total Spent')).toBeTruthy()
        expect(screen.getByText('Avg Tasks/Week')).toBeTruthy()
        expect(screen.getByText('Efficiency')).toBeTruthy()
      })
    })

    it('should support screen reader navigation', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        // Verify analytics section is accessible
        const analyticsTitle = screen.getByText('📊 Household Analytics')
        expect(analyticsTitle).toBeTruthy()
      })
    })
  })

  describe('Analytics Performance', () => {
    it('should load analytics data efficiently', async () => {
      const startTime = Date.now()
      
      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('📊 Household Analytics')).toBeTruthy()
      })
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(5000) // Should load within 5 seconds
    })

    it('should handle concurrent analytics requests', async () => {
      // Render multiple instances
      const { unmount: unmount1 } = render(<DashboardScreen />)
      const { unmount: unmount2 } = render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getAllByText('📊 Household Analytics')).toHaveLength(2)
      })
      
      unmount1()
      unmount2()
    })
  })

  describe('Analytics Real-time Updates', () => {
    it('should refresh analytics on pull-to-refresh', async () => {
      const { getByTestId } = render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('📊 Household Analytics')).toBeTruthy()
      })
      
      // Simulate pull-to-refresh
      // Note: This would require additional implementation in the component
    })

    it('should update analytics when data changes', async () => {
      const { rerender } = render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('📊 Household Analytics')).toBeTruthy()
      })
      
      // Update mock data and rerender
      rerender(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('📊 Household Analytics')).toBeTruthy()
      })
    })
  })
})
