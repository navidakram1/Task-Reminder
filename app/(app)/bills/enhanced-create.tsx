import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'

interface HouseholdMember {
  user_id: string
  profiles: {
    id: string
    name: string
    email: string
  }
}

interface BillItem {
  id: string
  name: string
  amount: number
  participants: string[]
}

interface Split {
  userId: string
  userName: string
  amount: number
  shares?: number
  percentage?: number
}

type SplitMethod = 'equal' | 'percentage' | 'custom' | 'by_item' | 'by_shares'
type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'INR'

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' }
]

export default function EnhancedCreateBillScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('USD')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [taxAmount, setTaxAmount] = useState('')
  const [tipAmount, setTipAmount] = useState('')
  const [tipPercentage, setTipPercentage] = useState('')
  const [merchantName, setMerchantName] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal')
  const [splits, setSplits] = useState<Split[]>([])
  const [billItems, setBillItems] = useState<BillItem[]>([])
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([])
  const [categories, setCategories] = useState<any[]>([])
  
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringFrequency, setRecurringFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly')
  
  const [showCurrencyModal, setShowCurrencyModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const { user } = useAuth()

  useEffect(() => {
    fetchHouseholdMembers()
    fetchCategories()
    if (edit) {
      fetchBillDetails()
    }
  }, [])

  useEffect(() => {
    // Auto-suggest category based on title and merchant
    if (title || merchantName) {
      suggestCategory()
    }
  }, [title, merchantName])

  useEffect(() => {
    // Recalculate splits when method or amount changes
    if (amount && householdMembers.length > 0) {
      calculateSplits()
    }
  }, [splitMethod, amount, taxAmount, tipAmount, householdMembers])

  const fetchHouseholdMembers = async () => {
    if (!user) return

    try {
      const { data: householdMember } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .single()

      if (!householdMember) return

      const { data: members } = await supabase
        .from('household_members')
        .select('user_id')
        .eq('household_id', householdMember.household_id)

      if (members && members.length > 0) {
        const userIds = members.map(m => m.user_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', userIds)

        const enrichedMembers = members.map(member => {
          const profile = profiles?.find(p => p.id === member.user_id)
          return {
            user_id: member.user_id,
            profiles: profile
          }
        })

        setHouseholdMembers(enrichedMembers)
        
        // Initialize equal splits
        if (!edit) {
          const equalAmount = parseFloat(amount || '0') / enrichedMembers.length
          setSplits(enrichedMembers.map(member => ({
            userId: member.user_id,
            userName: member.profiles?.name || 'Unknown',
            amount: equalAmount,
            shares: 1,
            percentage: 100 / enrichedMembers.length
          })))
        }
      }
    } catch (error) {
      console.error('Error fetching household members:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('is_active', true)
        .order('name')

      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const suggestCategory = async () => {
    if (!title && !merchantName) return

    try {
      const { data } = await supabase.rpc('suggest_expense_category', {
        p_title: title,
        p_merchant: merchantName,
        p_amount: parseFloat(amount || '0')
      })

      if (data) {
        // Function now returns category name instead of ID
        setCategory(data)
      }
    } catch (error) {
      console.error('Error suggesting category:', error)
    }
  }

  const calculateSplits = () => {
    const totalAmount = parseFloat(amount || '0') + parseFloat(taxAmount || '0') + parseFloat(tipAmount || '0')
    
    switch (splitMethod) {
      case 'equal':
        const equalAmount = totalAmount / householdMembers.length
        setSplits(householdMembers.map(member => ({
          userId: member.user_id,
          userName: member.profiles?.name || 'Unknown',
          amount: equalAmount,
          shares: 1,
          percentage: 100 / householdMembers.length
        })))
        break
        
      case 'by_shares':
        const totalShares = splits.reduce((sum, split) => sum + (split.shares || 1), 0)
        setSplits(splits.map(split => ({
          ...split,
          amount: (split.shares || 1) * totalAmount / totalShares,
          percentage: (split.shares || 1) * 100 / totalShares
        })))
        break
        
      case 'percentage':
        setSplits(splits.map(split => ({
          ...split,
          amount: totalAmount * (split.percentage || 0) / 100
        })))
        break
        
      // Custom and by_item methods handled separately
    }
  }

  const addBillItem = () => {
    const newItem: BillItem = {
      id: Date.now().toString(),
      name: '',
      amount: 0,
      participants: []
    }
    setBillItems([...billItems, newItem])
  }

  const updateBillItem = (id: string, field: keyof BillItem, value: any) => {
    setBillItems(items => items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const removeBillItem = (id: string) => {
    setBillItems(items => items.filter(item => item.id !== id))
  }

  const calculateItemizedSplits = () => {
    const itemSplits: Record<string, number> = {}
    
    // Initialize all members with 0
    householdMembers.forEach(member => {
      itemSplits[member.user_id] = 0
    })
    
    // Calculate splits for each item
    billItems.forEach(item => {
      if (item.participants.length > 0) {
        const itemSplitAmount = item.amount / item.participants.length
        item.participants.forEach(participantId => {
          itemSplits[participantId] += itemSplitAmount
        })
      }
    })
    
    // Add tax and tip proportionally
    const totalItemAmount = billItems.reduce((sum, item) => sum + item.amount, 0)
    const taxAndTip = parseFloat(taxAmount || '0') + parseFloat(tipAmount || '0')
    
    const newSplits = householdMembers.map(member => {
      const baseAmount = itemSplits[member.user_id]
      const taxTipShare = totalItemAmount > 0 ? (baseAmount / totalItemAmount) * taxAndTip : 0
      const totalAmount = baseAmount + taxTipShare
      
      return {
        userId: member.user_id,
        userName: member.profiles?.name || 'Unknown',
        amount: totalAmount,
        percentage: totalItemAmount > 0 ? (baseAmount / totalItemAmount) * 100 : 0
      }
    })
    
    setSplits(newSplits)
  }

  const validateSplits = () => {
    const totalAmount = parseFloat(amount || '0') + parseFloat(taxAmount || '0') + parseFloat(tipAmount || '0')
    const splitsTotal = splits.reduce((sum, split) => sum + split.amount, 0)
    const difference = Math.abs(totalAmount - splitsTotal)
    
    return difference < 0.01 // Allow 1 cent difference for rounding
  }

  const handleSubmit = async () => {
    if (!title.trim() || !amount || !validateSplits()) {
      Alert.alert('Error', 'Please fill in all required fields and ensure splits add up correctly')
      return
    }

    setLoading(true)

    try {
      const { data: householdMember } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user?.id)
        .single()

      if (!householdMember) {
        Alert.alert('Error', 'You must be part of a household to create bills')
        return
      }

      const totalAmount = parseFloat(amount) + parseFloat(taxAmount || '0') + parseFloat(tipAmount || '0')

      // Create or update bill
      const billData = {
        household_id: householdMember.household_id,
        title: title.trim(),
        description: description.trim(),
        amount: totalAmount,
        currency,
        category: category || null, // Use existing 'category' column
        date,
        due_date: dueDate || null,
        tax_amount: parseFloat(taxAmount || '0'),
        tip_amount: parseFloat(tipAmount || '0'),
        tip_percentage: parseFloat(tipPercentage || '0') || null,
        paid_by: user?.id,
        split_method: splitMethod,
        merchant_name: merchantName.trim() || null,
        location: location.trim() || null,
        notes: notes.trim() || null,
        is_recurring: isRecurring,
        recurring_frequency: isRecurring ? recurringFrequency : null,
        next_due_date: isRecurring && dueDate ? calculateNextDueDate(dueDate, recurringFrequency) : null
      }

      let billId: string

      if (edit) {
        const { error } = await supabase
          .from('bills')
          .update(billData)
          .eq('id', edit)
        
        if (error) throw error
        billId = edit
      } else {
        const { data: newBill, error } = await supabase
          .from('bills')
          .insert(billData)
          .select('id')
          .single()
        
        if (error) throw error
        billId = newBill.id
      }

      // Delete existing splits if editing
      if (edit) {
        await supabase
          .from('bill_splits')
          .delete()
          .eq('bill_id', edit)
      }

      // Create bill splits
      const splitData = splits.map(split => ({
        bill_id: billId,
        user_id: split.userId,
        amount: split.amount,
        currency,
        shares: split.shares || null,
        percentage: split.percentage || null
      }))

      const { error: splitsError } = await supabase
        .from('bill_splits')
        .insert(splitData)

      if (splitsError) throw splitsError

      // Create bill items if using itemized splitting
      if (splitMethod === 'by_item' && billItems.length > 0) {
        const itemData = billItems.map(item => ({
          bill_id: billId,
          name: item.name,
          amount: item.amount,
          participants: item.participants
        }))

        const { error: itemsError } = await supabase
          .from('bill_items')
          .insert(itemData)

        if (itemsError) throw itemsError
      }

      Alert.alert(
        'Success',
        edit ? 'Bill updated successfully!' : 'Bill created successfully!',
        [{ text: 'OK', onPress: () => router.back() }]
      )
    } catch (error: any) {
      console.error('Error saving bill:', error)
      Alert.alert('Error', error.message || 'Failed to save bill')
    } finally {
      setLoading(false)
    }
  }

  const calculateNextDueDate = (currentDue: string, frequency: string): string => {
    const date = new Date(currentDue)
    switch (frequency) {
      case 'weekly':
        date.setDate(date.getDate() + 7)
        break
      case 'monthly':
        date.setMonth(date.getMonth() + 1)
        break
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1)
        break
    }
    return date.toISOString().split('T')[0]
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerGradient}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.title}>
                {edit ? '✏️ Edit Bill' : '💰 New Bill'}
              </Text>
              <Text style={styles.subtitle}>
                {splitMethod === 'by_item' ? 'Itemized splitting' : `Split ${splitMethod}`}
              </Text>
            </View>
            <View style={styles.placeholder} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Bill Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Bill Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="What's this bill for?"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add details about this expense..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 2 }]}>
              <Text style={styles.inputLabel}>Amount *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.inputLabel}>Currency</Text>
              <TouchableOpacity
                style={styles.currencyButton}
                onPress={() => setShowCurrencyModal(true)}
              >
                <Text style={styles.currencyText}>
                  {CURRENCIES.find(c => c.code === currency)?.symbol} {currency}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Continue with more sections... */}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
