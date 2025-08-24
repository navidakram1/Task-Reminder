import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import React, { useState } from 'react'
import {
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'

const { width } = Dimensions.get('window')

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  helpful_count: number
}

interface HelpCategory {
  id: string
  name: string
  icon: string
  description: string
  article_count: number
}

export default function HelpCenterScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)

  const categories: HelpCategory[] = [
    {
      id: 'all',
      name: 'All Topics',
      icon: '📚',
      description: 'Browse all help articles',
      article_count: 24
    },
    {
      id: 'getting-started',
      name: 'Getting Started',
      icon: '🚀',
      description: 'Learn the basics of HomeTask',
      article_count: 8
    },
    {
      id: 'tasks',
      name: 'Task Management',
      icon: '✅',
      description: 'Creating and managing tasks',
      article_count: 6
    },
    {
      id: 'bills',
      name: 'Bill Splitting',
      icon: '💰',
      description: 'Managing expenses and payments',
      article_count: 5
    },
    {
      id: 'household',
      name: 'Household Setup',
      icon: '🏠',
      description: 'Managing members and settings',
      article_count: 3
    },
    {
      id: 'account',
      name: 'Account & Billing',
      icon: '👤',
      description: 'Profile and subscription help',
      article_count: 2
    }
  ]

  const faqs: FAQItem[] = [
    {
      id: '1',
      question: 'How do I create my first household?',
      answer: 'To create a household, go to the onboarding flow after signing up. You can also create a new household from Settings > Household Management. Give your household a name and start inviting family members or roommates.',
      category: 'getting-started',
      helpful_count: 45
    },
    {
      id: '2',
      question: 'How do I invite family members to my household?',
      answer: 'You can invite members by going to Settings > Household Management > Invite Members. Share the invite link via text, email, or social media. Members can also join using your household invite code.',
      category: 'household',
      helpful_count: 38
    },
    {
      id: '3',
      question: 'How does the random task assignment work?',
      answer: 'Random assignment uses our fair distribution algorithm to assign tasks based on each member\'s current workload, availability, and past assignments. This ensures everyone gets an equal share of household responsibilities.',
      category: 'tasks',
      helpful_count: 32
    },
    {
      id: '4',
      question: 'Can I split bills unequally among household members?',
      answer: 'Yes! When adding a bill, you can choose from equal split, percentage-based split, or custom amounts for each member. This is perfect for situations where some members use more of a service than others.',
      category: 'bills',
      helpful_count: 29
    },
    {
      id: '5',
      question: 'How do I set up recurring tasks?',
      answer: 'When creating a task, select the recurrence option and choose daily, weekly, or monthly. The task will automatically be recreated based on your schedule, and you can modify or stop the recurrence at any time.',
      category: 'tasks',
      helpful_count: 27
    },
    {
      id: '6',
      question: 'What happens if I miss a task deadline?',
      answer: 'Overdue tasks will appear in red on your dashboard and you\'ll receive reminder notifications. Your household members can see overdue tasks too, promoting accountability. You can still complete overdue tasks - they just won\'t count toward streak bonuses.',
      category: 'tasks',
      helpful_count: 24
    },
    {
      id: '7',
      question: 'How do I upgrade to Premium?',
      answer: 'Go to Settings > Subscription to view premium plans. Choose between monthly ($3/month) or lifetime ($15 one-time) options. Premium includes unlimited tasks, advanced analytics, priority support, and more features.',
      category: 'account',
      helpful_count: 22
    },
    {
      id: '8',
      question: 'Can I use HomeTask offline?',
      answer: 'HomeTask requires an internet connection for real-time sync between household members. However, you can view your tasks and bills offline, and changes will sync when you reconnect to the internet.',
      category: 'getting-started',
      helpful_count: 18
    }
  ]

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId)
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.backgroundGradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Help Center</Text>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => router.push('/(app)/support/contact')}
            >
              <Text style={styles.contactButtonText}>💬</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <BlurView intensity={20} style={styles.searchCard}>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search help articles..."
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </BlurView>

          {/* Quick Actions */}
          <BlurView intensity={20} style={styles.quickActionsCard}>
            <View style={styles.quickActionsContent}>
              <Text style={styles.quickActionsTitle}>Quick Help</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => router.push('/(app)/support/contact')}
                >
                  <Text style={styles.quickActionIcon}>💬</Text>
                  <Text style={styles.quickActionText}>Contact Support</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => router.push('/(app)/support/bug-report')}
                >
                  <Text style={styles.quickActionIcon}>🐛</Text>
                  <Text style={styles.quickActionText}>Report Bug</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => router.push('/(app)/support/feature-request')}
                >
                  <Text style={styles.quickActionIcon}>💡</Text>
                  <Text style={styles.quickActionText}>Request Feature</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionButton}
                  onPress={() => router.push('/(app)/support/video-tutorials')}
                >
                  <Text style={styles.quickActionIcon}>🎥</Text>
                  <Text style={styles.quickActionText}>Video Tutorials</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>

          {/* Categories */}
          <View style={styles.categoriesContainer}>
            <Text style={styles.categoriesTitle}>Browse by Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    selectedCategory === category.id && styles.categoryCardActive
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={[
                    styles.categoryName,
                    selectedCategory === category.id && styles.categoryNameActive
                  ]}>
                    {category.name}
                  </Text>
                  <Text style={styles.categoryCount}>
                    {category.article_count} articles
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* FAQ Section */}
          <BlurView intensity={20} style={styles.faqCard}>
            <View style={styles.faqContent}>
              <Text style={styles.faqTitle}>
                Frequently Asked Questions
                {searchQuery && ` (${filteredFAQs.length} results)`}
              </Text>
              
              {filteredFAQs.length === 0 ? (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsIcon}>🔍</Text>
                  <Text style={styles.noResultsTitle}>No results found</Text>
                  <Text style={styles.noResultsText}>
                    Try adjusting your search or browse by category
                  </Text>
                </View>
              ) : (
                filteredFAQs.map((faq, index) => (
                  <View key={faq.id} style={styles.faqItem}>
                    <TouchableOpacity
                      style={styles.faqQuestion}
                      onPress={() => toggleFAQ(faq.id)}
                    >
                      <Text style={styles.faqQuestionText}>{faq.question}</Text>
                      <Text style={styles.faqToggleIcon}>
                        {expandedFAQ === faq.id ? '−' : '+'}
                      </Text>
                    </TouchableOpacity>
                    
                    {expandedFAQ === faq.id && (
                      <View style={styles.faqAnswer}>
                        <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                        <View style={styles.faqFooter}>
                          <Text style={styles.faqHelpful}>
                            👍 {faq.helpful_count} people found this helpful
                          </Text>
                          <TouchableOpacity style={styles.faqHelpfulButton}>
                            <Text style={styles.faqHelpfulButtonText}>Was this helpful?</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          </BlurView>

          {/* Still Need Help */}
          <BlurView intensity={20} style={styles.helpCard}>
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>Still need help?</Text>
              <Text style={styles.helpDescription}>
                Can't find what you're looking for? Our support team is here to help!
              </Text>
              <TouchableOpacity
                style={styles.helpButton}
                onPress={() => router.push('/(app)/support/contact')}
              >
                <Text style={styles.helpButtonText}>Contact Support</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </ScrollView>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 20,
  },
  searchCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
  },
  quickActionsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickActionsContent: {
    padding: 20,
  },
  quickActionsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoriesTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  categoryCardActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryNameActive: {
    color: '#ffffff',
  },
  categoryCount: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  faqCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  faqContent: {
    padding: 20,
  },
  faqTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noResultsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noResultsText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
  faqItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  faqToggleIcon: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  faqAnswer: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  faqAnswerText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  faqFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqHelpful: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  faqHelpfulButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  faqHelpfulButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  helpCard: {
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  helpContent: {
    padding: 20,
    alignItems: 'center',
  },
  helpTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  helpDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  helpButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  helpButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
