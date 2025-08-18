import { supabase } from './supabase'
import { Platform } from 'react-native'

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

export interface UploadOptions {
  bucket: string
  folder?: string
  fileName?: string
  contentType?: string
  upsert?: boolean
}

class FileUploadService {
  private generateFileName(originalName?: string, extension?: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    
    if (originalName) {
      const ext = originalName.split('.').pop() || extension || 'jpg'
      return `${timestamp}_${random}.${ext}`
    }
    
    return `${timestamp}_${random}.${extension || 'jpg'}`
  }

  private async getFileBlob(uri: string): Promise<Blob> {
    if (Platform.OS === 'web') {
      const response = await fetch(uri)
      return response.blob()
    } else {
      // For React Native, we need to convert the file URI to a blob
      const response = await fetch(uri)
      return response.blob()
    }
  }

  async uploadFile(
    fileUri: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      const { bucket, folder = '', fileName, contentType = 'image/jpeg', upsert = false } = options

      // Generate file name if not provided
      const finalFileName = fileName || this.generateFileName(undefined, 'jpg')
      const filePath = folder ? `${folder}/${finalFileName}` : finalFileName

      // Get file blob
      const fileBlob = await this.getFileBlob(fileUri)

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileBlob, {
          contentType,
          upsert
        })

      if (error) {
        console.error('Upload error:', error)
        return { success: false, error: error.message }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      return {
        success: true,
        url: urlData.publicUrl,
        path: data.path
      }
    } catch (error) {
      console.error('File upload service error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }
    }
  }

  async uploadProfilePhoto(fileUri: string, userId: string): Promise<UploadResult> {
    return this.uploadFile(fileUri, {
      bucket: 'profile-photos',
      folder: 'avatars',
      fileName: `${userId}.jpg`,
      contentType: 'image/jpeg',
      upsert: true
    })
  }

  async uploadReceiptPhoto(fileUri: string, billId: string): Promise<UploadResult> {
    return this.uploadFile(fileUri, {
      bucket: 'receipts',
      folder: 'bills',
      fileName: `${billId}_${Date.now()}.jpg`,
      contentType: 'image/jpeg'
    })
  }

  async uploadTaskProofPhoto(fileUri: string, taskId: string, userId: string): Promise<UploadResult> {
    return this.uploadFile(fileUri, {
      bucket: 'task-proofs',
      folder: 'completions',
      fileName: `${taskId}_${userId}_${Date.now()}.jpg`,
      contentType: 'image/jpeg'
    })
  }

  async deleteFile(bucket: string, path: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path])

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }
    }
  }

  async getFileUrl(bucket: string, path: string): Promise<string | null> {
    try {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

      return data.publicUrl
    } catch (error) {
      console.error('Error getting file URL:', error)
      return null
    }
  }

  // Helper method to compress image before upload
  async compressImage(uri: string, quality: number = 0.8): Promise<string> {
    // For now, return the original URI
    // In a production app, you might want to use expo-image-manipulator
    // to compress images before upload
    return uri
  }

  // Validate file size and type
  validateFile(fileUri: string, maxSizeMB: number = 10): Promise<{ valid: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (Platform.OS === 'web') {
        fetch(fileUri)
          .then(response => response.blob())
          .then(blob => {
            const sizeMB = blob.size / (1024 * 1024)
            if (sizeMB > maxSizeMB) {
              resolve({ valid: false, error: `File size must be less than ${maxSizeMB}MB` })
            } else {
              resolve({ valid: true })
            }
          })
          .catch(() => {
            resolve({ valid: false, error: 'Unable to validate file' })
          })
      } else {
        // For React Native, we'll assume the file is valid for now
        // In production, you might want to check file size using react-native-fs
        resolve({ valid: true })
      }
    })
  }
}

export const fileUploadService = new FileUploadService()
export default fileUploadService
