import { Picker } from '@react-native-picker/picker'
import * as ImagePicker from 'expo-image-picker'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { useAuth } from '../../../contexts/AuthContext'
import { fileUploadService } from '../../../lib/fileUploadService'
import { supabase } from '../../../lib/supabase'

interface Split {
  userId: string
  userName: string
  amount: number
  percentage?: number
}

export default function CreateEditBillScreen() {
  const { edit } = useLocalSearchParams()
  const isEditing = !!edit
  
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [receiptUri, setReceiptUri] = useState<string | null>(null)
  const [splitMethod, setSplitMethod] = useState<'equal' | 'percentage' | 'custom'>('equal')
  const [splits, setSplits] = useState<Split[]>([])
  const [householdMembers, setHouseholdMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [household, setHousehold] = useState<any>(null)
  const { user } = useAuth()

  const categories = [
    'Groceries',
    'Utilities',
    'Rent',
    'Internet',
    'Dining Out',
    'Transportation',
    'Entertainment',
    'Shopping',
    'Other',
  ]

  useEffect(() => {
    fetchHouseholdMembers()
    if (isEditing) {
      fetchBillDetails()
    }
  }, [])

  useEffect(() => {
    if (householdMembers.length > 0 && !isEditing) {
      initializeSplits()
    }
  }, [householdMembers])

  useEffect(() => {
    if (amount && splits.length > 0) {
      updateSplitAmounts()
    }
  }, [amount, splitMethod])

  const fetchHouseholdMembers = async () => {
    if (!user) return

    try {
      // Get user's active household
      const { data: activeHouseholds } = await supabase
        .rpc('get_user_active_household', {
          p_user_id: user.id
        })

      let householdMember = null
      if (activeHouseholds && activeHouseholds.length > 0) {
        const activeHousehold = activeHouseholds[0]
        householdMember = {
          household_id: activeHousehold.household_id,
          households: {
            id: activeHousehold.household_id,
            name: activeHousehold.household_name
          }
        }
      } else {
        // Fallback to first household
        const { data: fallbackMember } = await supabase
          .from('household_members')
          .select(`
            household_id,
            households (
              id,
              name
            )
          `)
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()

        householdMember = fallbackMember
      }

      if (!householdMember?.households) return
      setHousehold(householdMember.households)

      // Get all household members
      const { data: members } = await supabase
        .from('household_members')
        .select('user_id')
        .eq('household_id', householdMember.household_id)

      if (members && members.length > 0) {
        // Get profiles for these users
        const userIds = members.map(m => m.user_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', userIds)

        // Combine data
        const enrichedMembers = members.map(member => {
          const profile = profiles?.find(p => p.id === member.user_id)
          return {
            user_id: member.user_id,
            profiles: profile
          }
        })

        setHouseholdMembers(enrichedMembers)
      }
    } catch (error) {
      console.error('Error fetching household members:', error)
    }
  }

  const fetchBillDetails = async () => {
    if (!edit) return

    try {
      // Fetch bill details
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .select('*')
        .eq('id', edit)
        .single()

      if (billError) throw billError

      setTitle(billData.title)
      setAmount(billData.amount.toString())
      setCategory(billData.category || '')
      setDate(billData.date)
      setReceiptUri(billData.receipt_url)

      // Fetch existing splits
      const { data: splitsData, error: splitsError } = await supabase
        .from('bill_splits')
        .select('*')
        .eq('bill_id', edit)

      if (splitsError) throw splitsError

      if (splitsData && splitsData.length > 0) {
        // Get profiles for split users
        const splitUserIds = splitsData.map(split => split.user_id)
        const { data: splitProfiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', splitUserIds)

        const existingSplits = splitsData.map(split => {
          const profile = splitProfiles?.find(p => p.id === split.user_id)
          return {
            userId: split.user_id,
            userName: profile?.name || 'Unknown',
            amount: split.amount,
          }
        })

        setSplits(existingSplits)
      }
    } catch (error) {
      console.error('Error fetching bill details:', error)
      Alert.alert('Error', 'Failed to load bill details')
    }
  }

  const initializeSplits = () => {
    const initialSplits = householdMembers.map(member => ({
      userId: member.user_id,
      userName: member.profiles?.name || member.profiles?.email || 'Unknown',
      amount: 0,
      percentage: 100 / householdMembers.length,
    }))
    setSplits(initialSplits)
  }

  const updateSplitAmounts = () => {
    const totalAmount = parseFloat(amount) || 0
    
    if (splitMethod === 'equal') {
      const equalAmount = totalAmount / splits.length
      setSplits(prev => prev.map(split => ({
        ...split,
        amount: equalAmount,
      })))
    } else if (splitMethod === 'percentage') {
      setSplits(prev => prev.map(split => ({
        ...split,
        amount: (totalAmount * (split.percentage || 0)) / 100,
      })))
    }
  }

  const handlePickReceipt = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload a receipt')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setReceiptUri(result.assets[0].uri)
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  const updateSplitAmount = (index: number, newAmount: string) => {
    const amount = parseFloat(newAmount) || 0
    setSplits(prev => prev.map((split, i) => 
      i === index ? { ...split, amount } : split
    ))
  }

  const updateSplitPercentage = (index: number, newPercentage: string) => {
    const percentage = parseFloat(newPercentage) || 0
    setSplits(prev => prev.map((split, i) => 
      i === index ? { ...split, percentage } : split
    ))
  }

  const getTotalSplitAmount = () => {
    return splits.reduce((total, split) => total + split.amount, 0)
  }

  const getTotalPercentage = () => {
    return splits.reduce((total, split) => total + (split.percentage || 0), 0)
  }

  const validateSplits = () => {
    const totalAmount = parseFloat(amount) || 0
    const totalSplits = getTotalSplitAmount()
    
    if (Math.abs(totalAmount - totalSplits) > 0.01) {
      Alert.alert('Error', `Split amounts (${totalSplits.toFixed(2)}) don't match bill total (${totalAmount.toFixed(2)})`)
      return false
    }

    if (splitMethod === 'percentage') {
      const totalPercentage = getTotalPercentage()
      if (Math.abs(totalPercentage - 100) > 0.01) {
        Alert.alert('Error', `Percentages must add up to 100% (currently ${totalPercentage.toFixed(1)}%)`)
        return false
      }
    }

    return true
  }

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a bill title')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount')
      return
    }

    if (!household) {
      Alert.alert('Error', 'No household found')
      return
    }

    if (!validateSplits()) {
      return
    }

    setLoading(true)
    try {
      const billData = {
        title: title.trim(),
        amount: parseFloat(amount),
        category: category || null,
        date,
        receipt_url: null, // Will be updated after upload
        household_id: household.id,
        paid_by: user?.id,
      }

      let billId = edit

      if (isEditing) {
        // Update existing bill
        const { error } = await supabase
          .from('bills')
          .update(billData)
          .eq('id', edit)

        if (error) throw error

        // Delete existing splits
        await supabase
          .from('bill_splits')
          .delete()
          .eq('bill_id', edit)
      } else {
        // Create new bill
        const { data, error } = await supabase
          .from('bills')
          .insert(billData)
          .select()
          .single()

        if (error) throw error
        billId = data.id
      }

      // Upload receipt photo if selected
      if (receiptUri && billId) {
        const uploadResult = await fileUploadService.uploadReceiptPhoto(receiptUri, billId)

        if (uploadResult.success) {
          // Update bill with receipt URL
          await supabase
            .from('bills')
            .update({ receipt_url: uploadResult.url })
            .eq('id', billId)
        } else {
          console.warn('Receipt upload failed:', uploadResult.error)
          // Continue with bill creation even if receipt upload fails
        }
      }

      // Create new splits
      const splitData = splits.map(split => ({
        bill_id: billId,
        user_id: split.userId,
        amount: split.amount,
        status: split.userId === user?.id ? 'paid' : 'owed',
      }))

      const { error: splitsError } = await supabase
        .from('bill_splits')
        .insert(splitData)

      if (splitsError) throw splitsError

      Alert.alert('Success', `Bill ${isEditing ? 'updated' : 'created'} successfully`)
      router.back()
    } catch (error: any) {
      console.error('Error saving bill:', error)
      Alert.alert('Error', error.message || 'Failed to save bill')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditing ? 'Edit Bill' : 'Add Bill'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={[styles.saveButton, loading && styles.disabledButton]}
        >
          <Text style={styles.saveText}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bill Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter bill title"
              autoCapitalize="sentences"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount *</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={category}
                onValueChange={setCategory}
                style={styles.picker}
              >
                <Picker.Item label="Select category (optional)" value="" />
                {categories.map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Receipt (Optional)</Text>
            <TouchableOpacity
              style={styles.receiptButton}
              onPress={handlePickReceipt}
            >
              <Text style={styles.receiptButtonText}>
                {receiptUri ? '📷 Receipt Added' : '📷 Add Receipt'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.splitSection}>
            <Text style={styles.sectionTitle}>Split Method</Text>

            <View style={styles.splitMethodContainer}>
              <TouchableOpacity
                style={[styles.splitMethodButton, splitMethod === 'equal' && styles.activeSplitMethod]}
                onPress={() => setSplitMethod('equal')}
              >
                <Text style={[styles.splitMethodText, splitMethod === 'equal' && styles.activeSplitMethodText]}>
                  Equal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.splitMethodButton, splitMethod === 'percentage' && styles.activeSplitMethod]}
                onPress={() => setSplitMethod('percentage')}
              >
                <Text style={[styles.splitMethodText, splitMethod === 'percentage' && styles.activeSplitMethodText]}>
                  Percentage
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.splitMethodButton, splitMethod === 'custom' && styles.activeSplitMethod]}
                onPress={() => setSplitMethod('custom')}
              >
                <Text style={[styles.splitMethodText, splitMethod === 'custom' && styles.activeSplitMethodText]}>
                  Custom
                </Text>
              </TouchableOpacity>
            </View>

            {splits.length > 0 && (
              <View style={styles.splitsContainer}>
                <Text style={styles.splitsTitle}>Split Details</Text>

                {splits.map((split, index) => (
                  <View key={split.userId} style={styles.splitRow}>
                    <Text style={styles.splitName}>{split.userName}</Text>

                    <View style={styles.splitInputs}>
                      {splitMethod === 'percentage' && (
                        <TextInput
                          style={styles.splitInput}
                          value={split.percentage?.toString() || ''}
                          onChangeText={(value) => updateSplitPercentage(index, value)}
                          placeholder="0"
                          keyboardType="decimal-pad"
                        />
                      )}

                      {(splitMethod === 'custom' || splitMethod === 'percentage') && (
                        <TextInput
                          style={styles.splitInput}
                          value={split.amount.toFixed(2)}
                          onChangeText={(value) => updateSplitAmount(index, value)}
                          placeholder="0.00"
                          keyboardType="decimal-pad"
                          editable={splitMethod === 'custom'}
                        />
                      )}

                      {splitMethod === 'equal' && (
                        <Text style={styles.splitAmount}>
                          ${split.amount.toFixed(2)}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}

                <View style={styles.splitSummary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Split:</Text>
                    <Text style={styles.summaryValue}>
                      ${getTotalSplitAmount().toFixed(2)}
                    </Text>
                  </View>

                  {splitMethod === 'percentage' && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total Percentage:</Text>
                      <Text style={[
                        styles.summaryValue,
                        getTotalPercentage() !== 100 && styles.errorValue
                      ]}>
                        {getTotalPercentage().toFixed(1)}%
                      </Text>
                    </View>
                  )}

                  {Math.abs(parseFloat(amount || '0') - getTotalSplitAmount()) > 0.01 && (
                    <Text style={styles.errorText}>
                      Split amounts don't match bill total
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  receiptButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  receiptButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  splitSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  splitMethodContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  splitMethodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeSplitMethod: {
    backgroundColor: '#667eea',
  },
  splitMethodText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeSplitMethodText: {
    color: '#fff',
  },
  splitsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  splitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  splitName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  splitInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  splitInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    width: 60,
    textAlign: 'center',
  },
  splitAmount: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  splitSummary: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  errorValue: {
    color: '#dc3545',
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
})
