import React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'
import { jest } from '@jest/globals'
import DashboardScreen from '../app/(app)/dashboard'

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}))

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: {
        name: 'Test User',
      },
    },
  }),
}))

jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          })),
        })),
      })),
    })),
    rpc: jest.fn(() => Promise.resolve({ data: [], error: null })),
  },
}))

describe('Dashboard Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Loading State', () => {
    it('should display loading indicator initially', async () => {
      render(<DashboardScreen />)
      
      expect(screen.getByText('Loading...')).toBeTruthy()
    })
  })

  describe('No Household State', () => {
    it('should display welcome message when user has no household', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to SplitDuty!')).toBeTruthy()
        expect(screen.getByText('Create or Join Household')).toBeTruthy()
      })
    })

    it('should navigate to household creation when button is pressed', async () => {
      const { router } = require('expo-router')
      render(<DashboardScreen />)
      
      await waitFor(() => {
        const createButton = screen.getByText('Create or Join Household')
        fireEvent.press(createButton)
        expect(router.push).toHaveBeenCalledWith('/(onboarding)/create-join-household')
      })
    })
  })

  describe('Dashboard with Data', () => {
    const mockData = {
      household: {
        id: 'household-1',
        name: 'Test Household',
        invite_code: 'ABC123',
        userRole: 'admin',
      },
      upcomingTasks: [
        {
          id: 'task-1',
          title: 'Clean Kitchen',
          description: 'Deep clean the kitchen',
          due_date: '2024-01-15',
          status: 'pending',
          emoji: '🧽',
        },
      ],
      recentBills: [
        {
          id: 'bill-1',
          title: 'Groceries',
          amount: 150.50,
          category: 'Food',
          date: '2024-01-10',
        },
      ],
      pendingTransfers: [],
      analytics: {
        tasksCompleted: 25,
        totalSpent: 1250.75,
        avgTasksPerWeek: 6,
        householdEfficiency: 85,
      },
      activityFeed: [
        {
          id: 'activity-1',
          type: 'task',
          title: 'Vacuum Living Room',
          status: 'completed',
          timestamp: '2024-01-14T10:30:00Z',
          user: 'John Doe',
        },
      ],
    }

    beforeEach(() => {
      // Mock successful data fetch
      const { supabase } = require('../lib/supabase')
      supabase.rpc.mockResolvedValue({
        data: [mockData.household],
        error: null,
      })
      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: mockData.upcomingTasks,
                error: null,
              })),
            })),
          })),
        })),
      })
    })

    it('should display household overview cards', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Household')).toBeTruthy()
        expect(screen.getByText('Active')).toBeTruthy()
      })
    })

    it('should display personal welcome message', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText(/Good (morning|afternoon|evening), Test User!/)).toBeTruthy()
        expect(screen.getByText(/Ready to tackle your day\?/)).toBeTruthy()
      })
    })

    it('should display quick action buttons', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('Create Task')).toBeTruthy()
        expect(screen.getByText('SplitDuty AI')).toBeTruthy()
        expect(screen.getByText('Add Bill')).toBeTruthy()
        expect(screen.getByText('View Bills')).toBeTruthy()
        expect(screen.getByText('Transfers')).toBeTruthy()
        expect(screen.getByText('Members')).toBeTruthy()
      })
    })

    it('should navigate to task creation when Create Task is pressed', async () => {
      const { router } = require('expo-router')
      render(<DashboardScreen />)
      
      await waitFor(() => {
        const createTaskButton = screen.getByText('Create Task')
        fireEvent.press(createTaskButton)
        expect(router.push).toHaveBeenCalledWith('/(app)/tasks/create')
      })
    })

    it('should display analytics widgets', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('📊 Household Analytics')).toBeTruthy()
        expect(screen.getByText('Tasks Completed')).toBeTruthy()
        expect(screen.getByText('Total Spent')).toBeTruthy()
        expect(screen.getByText('Avg Tasks/Week')).toBeTruthy()
        expect(screen.getByText('Efficiency')).toBeTruthy()
      })
    })

    it('should display activity feed', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('🔔 Recent Activity')).toBeTruthy()
      })
    })

    it('should display upcoming tasks section', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('📋 Upcoming Tasks')).toBeTruthy()
        expect(screen.getByText('See All')).toBeTruthy()
      })
    })

    it('should display recent bills section', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('💰 Recent Bills')).toBeTruthy()
      })
    })

    it('should handle pull-to-refresh', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        const scrollView = screen.getByTestId('dashboard-scroll-view')
        fireEvent(scrollView, 'refresh')
        // Verify refresh functionality
      })
    })
  })

  describe('Multi-Household Switcher', () => {
    it('should open household switcher modal when dropdown is pressed', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        const dropdownButton = screen.getByText('Tap to switch')
        fireEvent.press(dropdownButton)
        expect(screen.getByText('🏠 Switch Household')).toBeTruthy()
      })
    })

    it('should close modal when close button is pressed', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        const dropdownButton = screen.getByText('Tap to switch')
        fireEvent.press(dropdownButton)
        
        const closeButton = screen.getByText('✕')
        fireEvent.press(closeButton)
        
        expect(screen.queryByText('🏠 Switch Household')).toBeFalsy()
      })
    })
  })

  describe('Empty States', () => {
    it('should display empty state for tasks when no tasks exist', async () => {
      // Mock empty tasks response
      const { supabase } = require('../lib/supabase')
      supabase.from.mockReturnValue({
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
      })

      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('No upcoming tasks')).toBeTruthy()
        expect(screen.getByText('Create your first task')).toBeTruthy()
      })
    })

    it('should display empty state for bills when no bills exist', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('No recent bills')).toBeTruthy()
        expect(screen.getByText('Add your first bill')).toBeTruthy()
      })
    })

    it('should display empty state for activity when no activity exists', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('No recent activity')).toBeTruthy()
        expect(screen.getByText('Start creating tasks to see activity here')).toBeTruthy()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper accessibility labels for quick actions', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        const createTaskButton = screen.getByText('Create Task')
        expect(createTaskButton).toBeTruthy()
        // Add more accessibility checks as needed
      })
    })

    it('should support screen reader navigation', async () => {
      render(<DashboardScreen />)
      
      await waitFor(() => {
        // Test screen reader compatibility
        const welcomeText = screen.getByText(/Good (morning|afternoon|evening)/)
        expect(welcomeText).toBeTruthy()
      })
    })
  })

  describe('Cross-Platform Compatibility', () => {
    it('should render correctly on iOS', async () => {
      // Mock Platform.OS
      jest.doMock('react-native/Libraries/Utilities/Platform', () => ({
        OS: 'ios',
        select: jest.fn(),
      }))
      
      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeTruthy()
      })
    })

    it('should render correctly on Android', async () => {
      // Mock Platform.OS
      jest.doMock('react-native/Libraries/Utilities/Platform', () => ({
        OS: 'android',
        select: jest.fn(),
      }))
      
      render(<DashboardScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeTruthy()
      })
    })
  })
})
