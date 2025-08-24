import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  Platform,
  Image,
} from 'react-native'

export interface Member {
  user_id: string
  name?: string
  email?: string
  role?: string
  avatar_url?: string
  profiles?: {
    name?: string
    email?: string
    avatar_url?: string
  }
}

interface MemberSelectorProps {
  members: Member[]
  selectedMemberId?: string
  onMemberChange: (memberId: string) => void
  placeholder?: string
  title?: string
  allowUnassigned?: boolean
  disabled?: boolean
  style?: any
}

export default function MemberSelector({
  members,
  selectedMemberId,
  onMemberChange,
  placeholder = "Select a person",
  title = "Assign To",
  allowUnassigned = true,
  disabled = false,
  style
}: MemberSelectorProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const selectedMember = members.find(member => member.user_id === selectedMemberId)
  
  const filteredMembers = members.filter(member => {
    const name = member.profiles?.name || member.name || ''
    const email = member.profiles?.email || member.email || ''
    const query = searchQuery.toLowerCase()
    return name.toLowerCase().includes(query) || email.toLowerCase().includes(query)
  })

  const handleSelect = (memberId: string) => {
    onMemberChange(memberId)
    setIsVisible(false)
    setSearchQuery('')
  }

  const getMemberDisplayName = (member: Member) => {
    return member.profiles?.name || member.name || member.profiles?.email || member.email || 'Unknown'
  }

  const getMemberSubtitle = (member: Member) => {
    const role = member.role ? ` (${member.role})` : ''
    const email = member.profiles?.email || member.email
    return email ? `${email}${role}` : role
  }

  const getMemberInitials = (member: Member) => {
    const name = getMemberDisplayName(member)
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.selector, disabled && styles.selectorDisabled, style]}
        onPress={() => !disabled && setIsVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.selectorContent}>
          {selectedMember ? (
            <View style={styles.selectedContent}>
              <View style={styles.avatar}>
                {selectedMember.profiles?.avatar_url || selectedMember.avatar_url ? (
                  <Image
                    source={{ uri: selectedMember.profiles?.avatar_url || selectedMember.avatar_url }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {getMemberInitials(selectedMember)}
                  </Text>
                )}
              </View>
              <View style={styles.selectedTextContainer}>
                <Text style={styles.selectedText}>
                  {getMemberDisplayName(selectedMember)}
                </Text>
                <Text style={styles.selectedSubtitle}>
                  {getMemberSubtitle(selectedMember)}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.placeholder}>{placeholder}</Text>
          )}
        </View>
        <Text style={[styles.arrow, disabled && styles.arrowDisabled]}>⌄</Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{title}</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search members..."
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
          </View>

          {/* Members List */}
          <ScrollView style={styles.membersList} showsVerticalScrollIndicator={false}>
            {/* Unassigned Option */}
            {allowUnassigned && (
              <TouchableOpacity
                style={[
                  styles.memberOption,
                  !selectedMemberId && styles.selectedOption
                ]}
                onPress={() => handleSelect('')}
                activeOpacity={0.6}
              >
                <View style={styles.memberContent}>
                  <View style={[styles.avatar, styles.unassignedAvatar]}>
                    <Text style={styles.unassignedAvatarText}>?</Text>
                  </View>
                  <View style={styles.memberTextContainer}>
                    <Text style={[
                      styles.memberText,
                      !selectedMemberId && styles.selectedMemberText
                    ]}>
                      Unassigned
                    </Text>
                    <Text style={styles.memberSubtitle}>
                      No one assigned to this task
                    </Text>
                  </View>
                </View>
                {!selectedMemberId && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            )}

            {/* Members */}
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member, index) => (
                <TouchableOpacity
                  key={member.user_id}
                  style={[
                    styles.memberOption,
                    member.user_id === selectedMemberId && styles.selectedOption,
                    index === filteredMembers.length - 1 && !allowUnassigned && styles.lastOption
                  ]}
                  onPress={() => handleSelect(member.user_id)}
                  activeOpacity={0.6}
                >
                  <View style={styles.memberContent}>
                    <View style={styles.avatar}>
                      {member.profiles?.avatar_url || member.avatar_url ? (
                        <Image
                          source={{ uri: member.profiles?.avatar_url || member.avatar_url }}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <Text style={styles.avatarText}>
                          {getMemberInitials(member)}
                        </Text>
                      )}
                    </View>
                    <View style={styles.memberTextContainer}>
                      <Text style={[
                        styles.memberText,
                        member.user_id === selectedMemberId && styles.selectedMemberText
                      ]}>
                        {getMemberDisplayName(member)}
                      </Text>
                      <Text style={styles.memberSubtitle}>
                        {getMemberSubtitle(member)}
                      </Text>
                    </View>
                  </View>
                  {member.user_id === selectedMemberId && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {searchQuery ? 'No members found' : 'No members available'}
                </Text>
                {searchQuery && (
                  <Text style={styles.emptyStateSubtext}>
                    Try adjusting your search
                  </Text>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  selectorDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  selectorContent: {
    flex: 1,
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedTextContainer: {
    flex: 1,
  },
  selectedText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  placeholder: {
    fontSize: 16,
    color: '#999',
  },
  arrow: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  arrowDisabled: {
    color: '#ccc',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  unassignedAvatar: {
    backgroundColor: '#999',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  unassignedAvatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  membersList: {
    flex: 1,
  },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  selectedOption: {
    backgroundColor: '#f8f9ff',
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  memberContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberTextContainer: {
    flex: 1,
  },
  memberText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedMemberText: {
    color: '#667eea',
    fontWeight: '600',
  },
  memberSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 18,
    color: '#667eea',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
})
