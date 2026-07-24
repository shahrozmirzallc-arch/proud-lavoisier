// src/services/cloudinaryService.js
// Enterprise Cloudinary Upload Service for IDS Pulse Media Plane

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset';

/**
 * Uploads a file (File object, Blob, or Base64 string) directly to Cloudinary.
 * @param {File|Blob|string} fileOrBase64 - Image file or data URL to upload
 * @param {string} folder - Destination subfolder inside ids_pulse/
 * @returns {Promise<{success: boolean, url: string, public_id: string, error?: string}>}
 */
export async function uploadToCloudinary(fileOrBase64, folder = 'incidents') {
  try {
    const formData = new FormData();
    formData.append('file', fileOrBase64);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', `ids_pulse/${folder}`);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error?.message || 'Cloudinary upload failed');
    }

    const data = await res.json();
    return {
      success: true,
      url: data.secure_url,
      public_id: data.public_id,
      format: data.format,
      bytes: data.bytes
    };
  } catch (err) {
    console.error('[Cloudinary] Upload Exception:', err);
    return {
      success: false,
      error: err.message
    };
  }
}
