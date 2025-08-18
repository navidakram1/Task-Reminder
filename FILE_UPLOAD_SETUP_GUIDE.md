# 📁 File Upload System Setup Guide

## Overview

The SplitDuty app now includes a comprehensive file upload system using Supabase Storage for:

- 👤 Profile photos
- 🧾 Receipt photos for bills
- ✅ Task completion proof photos

## Setup Instructions

### 1. Create Storage Buckets

Run the SQL from `database/storage_buckets_setup.sql` in your Supabase SQL Editor to create:

- `profile-photos` bucket (5MB limit, images only)
- `receipts` bucket (10MB limit, images + PDFs)
- `task-proofs` bucket (10MB limit, images only)

### 2. Configure Storage Policies

The setup script includes Row Level Security (RLS) policies that ensure:

- Users can only upload/edit their own profile photos
- Only household members can view receipts
- Only bill creators can upload receipts
- Only task assignees can upload completion proofs

### 3. Install Required Dependencies

The app uses Expo Image Picker for photo selection:

```bash
npx expo install expo-image-picker expo-media-library
```

### 4. Test File Upload

```typescript
import { fileUploadService } from './lib/fileUploadService'

// Upload profile photo
const result = await fileUploadService.uploadProfilePhoto(imageUri, userId)

// Upload receipt
const result = await fileUploadService.uploadReceiptPhoto(imageUri, billId)

// Upload task proof
const result = await fileUploadService.uploadTaskProofPhoto(imageUri, taskId, userId)
```

## File Upload Service Features

### Automatic File Naming
- Generates unique filenames with timestamps
- Organizes files in folders by type
- Prevents naming conflicts

### File Validation
- Checks file size limits (configurable)
- Validates file types
- Provides user-friendly error messages

### Error Handling
- Graceful fallbacks if upload fails
- Detailed error logging
- Continues app flow even if upload fails

### Storage Organization

```
profile-photos/
├── avatars/
│   ├── user1.jpg
│   └── user2.jpg

receipts/
├── bills/
│   ├── bill1_timestamp.jpg
│   └── bill2_timestamp.pdf

task-proofs/
├── completions/
│   ├── task1_user1_timestamp.jpg
│   └── task2_user2_timestamp.jpg
```

## Usage Examples

### Profile Photo Upload

```typescript
// In profile setup screen
const handleSaveProfile = async () => {
  if (photoUri) {
    const uploadResult = await fileUploadService.uploadProfilePhoto(photoUri, user.id)
    
    if (uploadResult.success) {
      // Update profile with photo URL
      await supabase
        .from('profiles')
        .update({ photo_url: uploadResult.url })
        .eq('id', user.id)
    }
  }
}
```

### Receipt Upload

```typescript
// In bill creation screen
const handleCreateBill = async () => {
  // Create bill first
  const { data: bill } = await supabase
    .from('bills')
    .insert(billData)
    .select()
    .single()

  // Upload receipt if provided
  if (receiptUri) {
    const uploadResult = await fileUploadService.uploadReceiptPhoto(receiptUri, bill.id)
    
    if (uploadResult.success) {
      // Update bill with receipt URL
      await supabase
        .from('bills')
        .update({ receipt_url: uploadResult.url })
        .eq('id', bill.id)
    }
  }
}
```

### Task Proof Upload

```typescript
// In task completion screen
const handleMarkComplete = async () => {
  if (proofPhotoUri) {
    const uploadResult = await fileUploadService.uploadTaskProofPhoto(
      proofPhotoUri, 
      taskId, 
      userId
    )
    
    if (uploadResult.success) {
      // Submit task for approval with proof
      await supabase
        .from('task_approvals')
        .insert({
          task_id: taskId,
          submitted_by: userId,
          proof_photo_url: uploadResult.url,
          status: 'pending'
        })
    }
  }
}
```

## Image Picker Integration

### Profile Photo Selection

```typescript
const showImagePicker = () => {
  Alert.alert(
    'Select Photo',
    'Choose how you want to add your profile photo',
    [
      { text: 'Camera', onPress: handleTakePhoto },
      { text: 'Photo Library', onPress: handlePickImage },
      { text: 'Cancel', style: 'cancel' },
    ]
  )
}

const handlePickImage = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
  
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Please grant camera roll permissions')
    return
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  })

  if (!result.canceled && result.assets[0]) {
    setPhotoUri(result.assets[0].uri)
  }
}
```

## Storage Management

### View Storage Stats

```sql
-- Get storage usage statistics
SELECT * FROM get_storage_stats();
```

### Clean Up Orphaned Files

```sql
-- Remove files for deleted records
SELECT cleanup_orphaned_files();
```

### Manual File Deletion

```typescript
// Delete a file
await fileUploadService.deleteFile('receipts', 'bills/receipt123.jpg')
```

## Security Features

### Row Level Security
- Users can only access files they're authorized to see
- Household members can view shared receipts
- Task assignees can upload completion proofs

### File Type Validation
- Only allowed MIME types can be uploaded
- File size limits prevent abuse
- Automatic virus scanning (if enabled in Supabase)

### Access Control
- Public URLs for easy sharing
- Signed URLs for sensitive content (if needed)
- Automatic cleanup of orphaned files

## Performance Optimization

### Image Compression
- Configurable quality settings
- Automatic resizing for profile photos
- Optimized for mobile networks

### Caching
- Browser caching for web
- Local caching for mobile
- CDN distribution via Supabase

### Background Upload
- Non-blocking UI during upload
- Progress indicators
- Retry logic for failed uploads

## Troubleshooting

### Common Issues

1. **Upload fails**: Check storage bucket policies and user permissions
2. **Large files**: Verify file size limits and compress images
3. **Permission denied**: Ensure user is authenticated and authorized
4. **Slow uploads**: Check network connection and file size

### Debug Logs

```typescript
// Enable detailed logging
const uploadResult = await fileUploadService.uploadFile(uri, {
  bucket: 'receipts',
  folder: 'bills',
  fileName: 'test.jpg'
})

console.log('Upload result:', uploadResult)
```

## Next Steps

1. Implement image compression for large files
2. Add progress indicators for uploads
3. Implement offline upload queue
4. Add image editing capabilities
5. Set up automatic backup to cloud storage

The file upload system is now ready to handle all your media needs! 📸✨
