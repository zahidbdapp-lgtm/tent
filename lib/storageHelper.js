import { supabase } from './supabaseClient'

/**
 * Upload a file to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} bucket - The storage bucket name (e.g., 'nid-images', 'tenant-photos')
 * @param {string} folder - Optional subfolder within the bucket
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
export const uploadImage = async (file, bucket, folder = '') => {
  if (!file) {
    throw new Error('No file provided')
  }

  // Generate a unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = folder ? `${folder}/${fileName}` : fileName

  console.log(`[Supabase] Uploading ${file.name} (${(file.size / 1024).toFixed(1)}KB) to ${bucket}/${filePath}`)

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('[Supabase] Upload error:', error)
      throw new Error(`Storage upload failed: ${error.message}`)
    }

    // Get public URL (assuming bucket is public)
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    console.log('[Supabase] Upload success! URL:', publicUrl.substring(0, 80))
    return publicUrl
  } catch (err) {
    console.error('[Supabase] Upload exception:', err)
    throw err
  }
}

/**
 * Delete a file from Supabase Storage
 * @param {string} bucket - The storage bucket name
 * @param {string} path - The file path in the bucket
 */
export const deleteImage = async (bucket, path) => {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) {
    console.error('[Supabase] Delete error:', error)
    throw error
  }
}
