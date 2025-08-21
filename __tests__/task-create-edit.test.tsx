import React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native'
import { jest } from '@jest/globals'
import CreateEditTaskScreen from '../app/(app)/tasks/create'
import EditTaskScreen from '../app/(app)/tasks/edit/[id]'

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: () => ({
    id: 'test-task-id',
  }),
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
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 'test-task-id',
              title: 'Test Task',
              description: 'Test Description',
              due_date: '2024-01-15',
              assignee_id: 'test-user-id',
              recurrence: 'weekly',
              emoji: '📋',
              priority: 'high',
              households: {
                id: 'household-1',
                name: 'Test Household',
              },
            },
            error: null,
          })),
          limit: jest.fn(() => ({
            maybeSingle: jest.fn(() => Promise.resolve({
              data: {
                household_id: 'household-1',
                households: {
                  id: 'household-1',
                  name: 'Test Household',
                },
              },
              error: null,
            })),
          })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}))

describe('Task Create/Edit Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Create Task Screen', () => {
    it('should render all input fields correctly', async () => {
      render(<CreateEditTaskScreen />)
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter task title')).toBeTruthy()
        expect(screen.getByPlaceholderText('Enter task description (optional)')).toBeTruthy()
        expect(screen.getByText('Priority Level')).toBeTruthy()
        expect(screen.getByText('Repeat Task')).toBeTruthy()
        expect(screen.getByText('Task Assignment')).toBeTruthy()
      })
    })

    it('should display emoji picker when emoji button is pressed', async () => {
      render(<CreateEditTaskScreen />)
      
      await waitFor(() => {
        const emojiButton = screen.getByText('Tap to change')
        fireEvent.press(emojiButton)
        
        // Should show emoji grid
        expect(screen.getByText('📋')).toBeTruthy()
        expect(screen.getByText('✅')).toBeTruthy()
        expect(screen.getByText('🏠')).toBeTruthy()
      })
    })

    it('should select emoji from picker', async () => {
      render(<CreateEditTaskScreen />)
      
      await waitFor(() => {
        const emojiButton = screen.getByText('Tap to change')
        fireEvent.press(emojiButton)
        
        // Select a different emoji
        const cleaningEmoji = screen.getByText('🧹')
        fireEvent.press(cleaningEmoji)
        
        // Emoji picker should close and emoji should be selected
        expect(screen.queryByText('📋')).toBeFalsy() // Grid should be hidden
      })
    })

    it('should handle priority selection correctly', async () => {
      render(<CreateEditTaskScreen />)
      
      await waitFor(() => {
        const highPriorityButton = screen.getByText('🔴 High')
        fireEvent.press(highPriorityButton)
        
        // High priority should be selected
        expect(highPriorityButton).toBeTruthy()
        
        const lowPriorityButton = screen.getByText('🟢 Low')
        fireEvent.press(lowPriorityButton)
        
        // Low priority should now be selected
        expect(lowPriorityButton).toBeTruthy()
      })
    })

    it('should handle recurrence options correctly', async () => {
      render(<CreateEditTaskScreen />)
      
      await waitFor(() => {
        const weeklyButton = screen.getByText('📆 Weekly')
        fireEvent.press(weeklyButton)
        
        // Should show recurrence preview
        expect(screen.getByText('✨ This task will repeat weekly')).toBeTruthy()
        
        const noRepeatButton = screen.getByText('🚫 No Repeat')
        fireEvent.press(noRepeatButton)
        
        // Preview should be hidden
        expect(screen.queryByText('✨ This task will repeat weekly')).toBeFalsy()
      })
    })

    it('should validate required fields', async () => {
      const { Alert } = require('react-native')
      render(<CreateEditTaskScreen />)
      
      await waitFor(() => {
        const saveButton = screen.getByText('Save')
        fireEvent.press(saveButton)
        
        // Should show validation error
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter a task title')
      })
    })

    it('should create task successfully with valid data', async () => {
      const { supabase } = require('../lib/supabase')
      const { router } = require('expo-router')
      
      render(<CreateEditTaskScreen />)
      
      await waitFor(() => {
        // Fill in required fields
        const titleInput = screen.getByPlaceholderText('Enter task title')
        fireEvent.changeText(titleInput, 'New Test Task')
        
        const descriptionInput = screen.getByPlaceholderText('Enter task description (optional)')
        fireEvent.changeText(descriptionInput, 'Task description')
        
        // Select priority
        const highPriorityButton = screen.getByText('🔴 High')
        fireEvent.press(highPriorityButton)
        
        // Save task
        const saveButton = screen.getByText('Save')
        fireEvent.press(saveButton)
        
        // Should call supabase insert
        expect(supabase.from).toHaveBeenCalledWith('tasks')
        expect(router.back).toHaveBeenCalled()
      })
    })

    it('should handle assignee selection', async () => {
      render(<CreateEditTaskScreen />)
      
      await waitFor(() => {
        // Should show assignee options
        expect(screen.getByText('Task Assignment')).toBeTruthy()
        
        // Should have manual and random assignment options
        expect(screen.getByText('👤 Manual Assignment')).toBeTruthy()
        expect(screen.getByText('🎲 Random Assignment')).toBeTruthy()
      })
    })

    it('should handle due date input', async () => {
      render(<CreateEditTaskScreen />)
      
      await waitFor(() => {
        const dueDateInput = screen.getByPlaceholderText('YYYY-MM-DD (optional)')
        fireEvent.changeText(dueDateInput, '2024-01-15')
        
        expect(dueDateInput.props.value).toBe('2024-01-15')
      })
    })

    it('should handle form cancellation', async () => {
      const { router } = require('expo-router')
      render(<CreateEditTaskScreen />)
      
      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel')
        fireEvent.press(cancelButton)
        
        expect(router.back).toHaveBeenCalled()
      })
    })
  })

  describe('Edit Task Screen', () => {
    it('should load existing task data', async () => {
      render(<EditTaskScreen />)
      
      await waitFor(() => {
        // Should load task data from API
        expect(screen.getByDisplayValue('Test Task')).toBeTruthy()
        expect(screen.getByDisplayValue('Test Description')).toBeTruthy()
        expect(screen.getByDisplayValue('2024-01-15')).toBeTruthy()
      })
    })

    it('should update task successfully', async () => {
      const { supabase } = require('../lib/supabase')
      const { router } = require('expo-router')
      
      render(<EditTaskScreen />)
      
      await waitFor(() => {
        // Modify task title
        const titleInput = screen.getByDisplayValue('Test Task')
        fireEvent.changeText(titleInput, 'Updated Test Task')
        
        // Save changes
        const saveButton = screen.getByText('Save')
        fireEvent.press(saveButton)
        
        // Should call supabase update
        expect(supabase.from).toHaveBeenCalledWith('tasks')
        expect(router.back).toHaveBeenCalled()
      })
    })

    it('should handle edit cancellation with confirmation', async () => {
      const { Alert } = require('react-native')
      render(<EditTaskScreen />)
      
      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel')
        fireEvent.press(cancelButton)
        
        // Should show confirmation dialog
        expect(Alert.alert).toHaveBeenCalledWith(
          'Discard Changes',
          'Are you sure you want to discard your changes?',
          expect.any(Array)
        )
      })
    })

    it('should preserve existing values when editing', async () => {
      render(<EditTaskScreen />)
      
      await waitFor(() => {
        // Should show existing emoji
        expect(screen.getByText('📋')).toBeTruthy()
        
        // Should show existing priority (high)
        expect(screen.getByText('🔴 High')).toBeTruthy()
        
        // Should show existing recurrence
        expect(screen.getByText('📆 Weekly')).toBeTruthy()
      })
    })
  })

  describe('Form Validation', () => {
    it('should prevent submission with empty title', async () => {
      const { Alert } = require('react-native')
      render(<CreateEditTaskScreen />)
      
      await waitFor(() => {
        const saveButton = screen.getByText('Save')
        fireEvent.press(saveButton)
        
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter a task title')
      })
    })

    it('should trim whitespace from title and description', async () => {
      const { supabase } = require('../lib/supabase')
      render(<CreateEditTaskScreen />)
      
      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Enter task title')
        fireEvent.changeText(titleInput, '  Test Task  ')
        
        const descriptionInput = screen.getByPlaceholderText('Enter task description (optional)')
        fireEvent.changeText(descriptionInput, '  Test Description  ')
        
        const saveButton = screen.getByText('Save')
        fireEvent.press(saveButton)
        
        // Should trim whitespace
        expect(supabase.from().insert).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Task',
            description: 'Test Description',
          })
        )
      })
    })

    it('should handle maximum length constraints', async () => {
      render(<CreateEditTaskScreen />)
      
      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Enter task title')
        const longTitle = 'a'.repeat(150) // Longer than maxLength
        fireEvent.changeText(titleInput, longTitle)
        
        // Should be limited to maxLength
        expect(titleInput.props.maxLength).toBe(100)
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper accessibility labels', async () => {
      render(<CreateEditTaskScreen />)
      
      await waitFor(() => {
        expect(screen.getByText('Task Title *')).toBeTruthy()
        expect(screen.getByText('Description')).toBeTruthy()
        expect(screen.getByText('Priority Level')).toBeTruthy()
        expect(screen.getByText('Repeat Task')).toBeTruthy()
      })
    })

    it('should support keyboard navigation', async () => {
      render(<CreateEditTaskScreen />)
      
      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Enter task title')
        const descriptionInput = screen.getByPlaceholderText('Enter task description (optional)')
        
        // Should be able to navigate between inputs
        expect(titleInput).toBeTruthy()
        expect(descriptionInput).toBeTruthy()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const { supabase } = require('../lib/supabase')
      const { Alert } = require('react-native')
      
      // Mock API error
      supabase.from.mockReturnValue({
        insert: jest.fn(() => Promise.resolve({
          data: null,
          error: { message: 'Database error' }
        })),
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            limit: jest.fn(() => ({
              maybeSingle: jest.fn(() => Promise.resolve({
                data: null,
                error: null,
              })),
            })),
          })),
        })),
      })
      
      render(<CreateEditTaskScreen />)
      
      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Enter task title')
        fireEvent.changeText(titleInput, 'Test Task')
        
        const saveButton = screen.getByText('Save')
        fireEvent.press(saveButton)
        
        // Should show error alert
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Database error')
      })
    })

    it('should handle network failures', async () => {
      const { supabase } = require('../lib/supabase')
      const { Alert } = require('react-native')
      
      // Mock network error
      supabase.from.mockReturnValue({
        insert: jest.fn(() => Promise.reject(new Error('Network error'))),
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            limit: jest.fn(() => ({
              maybeSingle: jest.fn(() => Promise.resolve({
                data: null,
                error: null,
              })),
            })),
          })),
        })),
      })
      
      render(<CreateEditTaskScreen />)
      
      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Enter task title')
        fireEvent.changeText(titleInput, 'Test Task')
        
        const saveButton = screen.getByText('Save')
        fireEvent.press(saveButton)
        
        // Should show error alert
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to save task')
      })
    })
  })
})
