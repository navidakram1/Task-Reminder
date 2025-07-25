import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'

export default function BillDetailsScreen() {
  const { id } = useLocalSearchParams()
  const [bill, setBill] = useState<any>(null)
  const [splits, setSplits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (id) {
      fetchBillDetails()
    }
  }, [id])

  const fetchBillDetails = async () => {
    try {
      // Fetch bill details
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .select('*')
        .eq('id', id)
        .single()

      if (billError) throw billError

      // Get paid by user info
      const { data: paidByUser } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('id', billData.paid_by)
        .single()

      setBill({
        ...billData,
        paid_by_user: paidByUser
      })

      // Fetch bill splits
      const { data: splitsData, error: splitsError } = await supabase
        .from('bill_splits')
        .select('*')
        .eq('bill_id', id)
        .order('amount', { ascending: false })

      if (splitsError) throw splitsError

      if (splitsData && splitsData.length > 0) {
        // Get profiles for split users
        const splitUserIds = splitsData.map(split => split.user_id)
        const { data: splitProfiles } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', splitUserIds)

        const enrichedSplits = splitsData.map(split => {
          const profile = splitProfiles?.find(p => p.id === split.user_id)
          return {
            ...split,
            profiles: profile
          }
        })

        setSplits(enrichedSplits)
      } else {
        setSplits([])
      }
    } catch (error) {
      console.error('Error fetching bill details:', error)
      Alert.alert('Error', 'Failed to load bill details')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async (splitId: string) => {
    try {
      const { error } = await supabase
        .from('bill_splits')
        .update({
          status: 'paid',
          settled_at: new Date().toISOString(),
        })
        .eq('id', splitId)

      if (error) throw error

      Alert.alert('Success', 'Payment marked as settled')
      await fetchBillDetails()
    } catch (error) {
      console.error('Error marking payment:', error)
      Alert.alert('Error', 'Failed to mark payment as settled')
    }
  }

  const handleEdit = () => {
    router.push(`/(app)/bills/create?edit=${bill.id}`)
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Bill',
      'Are you sure you want to delete this bill? This will also delete all associated splits.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete bill splits first
              const { error: splitsError } = await supabase
                .from('bill_splits')
                .delete()
                .eq('bill_id', bill.id)

              if (splitsError) throw splitsError

              // Delete bill
              const { error: billError } = await supabase
                .from('bills')
                .delete()
                .eq('id', bill.id)

              if (billError) throw billError

              Alert.alert('Success', 'Bill deleted successfully')
              router.back()
            } catch (error) {
              console.error('Error deleting bill:', error)
              Alert.alert('Error', 'Failed to delete bill')
            }
          },
        },
      ]
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`
  }

  const getTotalOwed = () => {
    return splits
      .filter(split => split.status === 'owed')
      .reduce((total, split) => total + split.amount, 0)
  }

  const getTotalPaid = () => {
    return splits
      .filter(split => split.status === 'paid')
      .reduce((total, split) => total + split.amount, 0)
  }

  const isCreator = bill?.paid_by === user?.id

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading bill...</Text>
      </View>
    )
  }

  if (!bill) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Bill not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        {isCreator && (
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.billHeader}>
          <Text style={styles.title}>{bill.title}</Text>
          <Text style={styles.totalAmount}>{formatCurrency(bill.amount)}</Text>
        </View>

        {bill.category && (
          <View style={styles.categorySection}>
            <Text style={styles.category}>{bill.category}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Paid by:</Text>
            <Text style={styles.detailValue}>{bill.paid_by_user?.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formatDate(bill.date)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total amount:</Text>
            <Text style={styles.detailValue}>{formatCurrency(bill.amount)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created:</Text>
            <Text style={styles.detailValue}>{formatDate(bill.created_at)}</Text>
          </View>
        </View>

        {bill.receipt_url && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Receipt</Text>
            <TouchableOpacity
              style={styles.receiptContainer}
              onPress={() => {
                // In a real app, you might want to open a full-screen image viewer
                Alert.alert('Receipt', 'Tap to view full size')
              }}
            >
              <Image
                source={{ uri: bill.receipt_url }}
                style={styles.receiptImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Split Breakdown</Text>
          
          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryAmount}>{formatCurrency(getTotalPaid())}</Text>
              <Text style={styles.summaryLabel}>Paid</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryAmount, styles.owedAmount]}>
                {formatCurrency(getTotalOwed())}
              </Text>
              <Text style={styles.summaryLabel}>Still Owed</Text>
            </View>
          </View>

          {splits.length > 0 ? (
            splits.map((split) => (
              <View key={split.id} style={styles.splitCard}>
                <View style={styles.splitInfo}>
                  <Text style={styles.splitName}>
                    {split.profiles?.name || 'Unknown User'}
                  </Text>
                  <Text style={styles.splitAmount}>
                    {formatCurrency(split.amount)}
                  </Text>
                </View>

                <View style={styles.splitStatus}>
                  {split.status === 'paid' ? (
                    <View style={styles.paidBadge}>
                      <Text style={styles.paidText}>✓ Paid</Text>
                      {split.settled_at && (
                        <Text style={styles.settledDate}>
                          {formatDate(split.settled_at)}
                        </Text>
                      )}
                    </View>
                  ) : (
                    <View style={styles.owedSection}>
                      <View style={styles.owedBadge}>
                        <Text style={styles.owedText}>Owes</Text>
                      </View>
                      
                      {(isCreator || split.user_id === user?.id) && (
                        <TouchableOpacity
                          style={styles.markPaidButton}
                          onPress={() => handleMarkPaid(split.id)}
                        >
                          <Text style={styles.markPaidText}>Mark Paid</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noSplitsContainer}>
              <Text style={styles.noSplitsText}>No splits created for this bill</Text>
              <TouchableOpacity
                style={styles.addSplitsButton}
                onPress={() => router.push(`/(app)/bills/create?edit=${bill.id}`)}
              >
                <Text style={styles.addSplitsButtonText}>Add Splits</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  billHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#28a745',
  },
  categorySection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  category: {
    fontSize: 16,
    color: '#666',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  receiptContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  receiptImage: {
    width: '100%',
    height: 200,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 4,
  },
  owedAmount: {
    color: '#ffc107',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  splitCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitInfo: {
    flex: 1,
  },
  splitName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  splitAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  splitStatus: {
    alignItems: 'flex-end',
  },
  paidBadge: {
    alignItems: 'center',
  },
  paidText: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '600',
  },
  settledDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  owedSection: {
    alignItems: 'center',
    gap: 8,
  },
  owedBadge: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  owedText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
  },
  markPaidButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  markPaidText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  noSplitsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noSplitsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  addSplitsButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addSplitsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
})
