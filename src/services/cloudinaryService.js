// src/services/cloudinaryService.js
// Enterprise Cloudinary Upload Service for IDS Pulse Media Plane (Images, Videos, Audio & PDFs)

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'olbzwhrw';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'unsigned_uploads';

/**
 * Validates a file against IDS Pulse Quality evidence restrictions.
 * @param {File|Blob|string} fileOrBase64 - File object or Base64 string to validate
 * @returns {{valid: boolean, error?: string, fileType: 'image'|'video'|'audio'|'pdf'}}
 */
export function validateMediaFile(fileOrBase64) {
  if (!fileOrBase64) {
    return { valid: false, error: 'No media file provided.' };
  }

  // Base64 Data URL validation
  if (typeof fileOrBase64 === 'string') {
    if (fileOrBase64.includes('image/svg+xml')) {
      return { valid: false, error: 'SVG vector files are explicitly prohibited.' };
    }
    if (fileOrBase64.startsWith('data:image/')) {
      return { valid: true, fileType: 'image' };
    }
    if (fileOrBase64.startsWith('data:video/')) {
      return { valid: true, fileType: 'video' };
    }
    if (fileOrBase64.startsWith('data:audio/')) {
      return { valid: true, fileType: 'audio' };
    }
    if (fileOrBase64.startsWith('data:application/pdf')) {
      return { valid: true, fileType: 'pdf' };
    }
    return { valid: true, fileType: 'image' };
  }

  // File object validation
  const fileName = (fileOrBase64.name || '').toLowerCase();
  const fileType = fileOrBase64.type || '';
  const fileSizeMB = fileOrBase64.size / (1024 * 1024);

  // Prohibited extensions check
  const prohibitedExts = ['.svg', '.exe', '.bat', '.sh', '.apk', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.tar', '.gz', '.rar'];
  if (prohibitedExts.some(ext => fileName.endsWith(ext))) {
    return { valid: false, error: `File type ${fileName} is explicitly prohibited for industrial quality evidence.` };
  }

  // Image validation
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
  if (imageTypes.includes(fileType) || /\.(jpe?g|png|heic|heif|webp)$/i.test(fileName)) {
    if (fileSizeMB > 20) return { valid: false, error: 'Image exceeds maximum size limit of 20 MB.' };
    return { valid: true, fileType: 'image' };
  }

  // Video validation
  const videoTypes = ['video/mp4', 'video/quicktime', 'video/x-m4v'];
  if (videoTypes.includes(fileType) || /\.(mp4|mov|m4v)$/i.test(fileName)) {
    if (fileSizeMB > 150) return { valid: false, error: 'Video evidence exceeds maximum size limit of 150 MB.' };
    return { valid: true, fileType: 'video' };
  }

  // Audio validation
  const audioTypes = ['audio/m4a', 'audio/aac', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mpeg'];
  if (audioTypes.includes(fileType) || /\.(m4a|aac|mp3|wav)$/i.test(fileName)) {
    if (fileSizeMB > 25) return { valid: false, error: 'Audio recording exceeds maximum size limit of 25 MB.' };
    return { valid: true, fileType: 'audio' };
  }

  // PDF validation
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    if (fileSizeMB > 20) return { valid: false, error: 'PDF evidence document exceeds maximum size limit of 20 MB.' };
    return { valid: true, fileType: 'pdf' };
  }

  return { valid: false, error: 'Unsupported media format. Please upload JPEG, PNG, HEIC, MP4, MOV, MP3, WAV or PDF files.' };
}

/**
 * Uploads any validated media asset (Image, Video, Audio or PDF) directly to Cloudinary using server-signed parameters.
 * @param {File|Blob|string} fileOrBase64 - File object, Blob, or Data URL to upload
 * @param {string} folder - Destination subfolder inside ids_pulse/ ('incidents' | 'expenses' | 'videos' | 'audio' | 'documents')
 * @returns {Promise<{success: boolean, url: string, public_id: string, resource_type?: string, bytes?: number, error?: string}>}
 */
export async function uploadToCloudinary(fileOrBase64, folder = 'incidents') {
  try {
    const val = validateMediaFile(fileOrBase64);
    if (!val.valid) {
      throw new Error(val.error);
    }

    const resourceEndpoint = (val.fileType === 'video' || val.fileType === 'audio') ? 'video' : (val.fileType === 'pdf' ? 'auto' : 'image');

    // 1. Fetch server-signed upload parameters from reserve-media-upload Edge Function
    let signedParams = null;
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wuqqrcowznrmmuokfxlk.supabase.co';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_S7Qpf1lJ6OCYbYrE-_5iLQ_lN9iEdNe';

      const reserveRes = await fetch(`${supabaseUrl}/functions/v1/reserve-media-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          resourceType: resourceEndpoint,
          mimeType: val.fileType === 'image' ? 'image/jpeg' : (val.fileType === 'video' ? 'video/mp4' : 'application/pdf'),
          fileSize: typeof fileOrBase64 === 'string' ? Math.round(fileOrBase64.length * 0.75) : (fileOrBase64.size || 1024),
          folder: `ids_pulse/${folder}`
        })
      });

      if (reserveRes.ok) {
        const reserveData = await reserveRes.json();
        if (reserveData?.signedParams) {
          signedParams = reserveData.signedParams;
        }
      }
    } catch (e) {
      console.warn('[Cloudinary] Edge Function reservation fallback to client signature:', e.message);
    }

    // 2. Perform authenticated upload to Cloudinary
    const formData = new FormData();
    formData.append('file', fileOrBase64);

    if (signedParams) {
      formData.append('api_key', signedParams.apiKey);
      formData.append('timestamp', signedParams.timestamp);
      formData.append('signature', signedParams.signature);
      formData.append('public_id', signedParams.publicId);
      formData.append('folder', signedParams.folder);
    } else {
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', `ids_pulse/${folder}`);
    }

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceEndpoint}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error?.message || 'Cloudinary media upload failed');
    }

    const data = await res.json();
    return {
      success: true,
      url: data.secure_url,
      public_id: data.public_id,
      format: data.format,
      resource_type: data.resource_type,
      bytes: data.bytes
    };
  } catch (err) {
    console.error('[Cloudinary] Media Upload Exception:', err);
    return {
      success: false,
      error: err.message
    };
  }
}
