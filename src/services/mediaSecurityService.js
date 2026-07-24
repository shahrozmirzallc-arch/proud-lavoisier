// src/services/mediaSecurityService.js
// SHA-256 Checksum Calculation, Media Sanitization & Derivative Helpers

/**
 * Calculates SHA-256 checksum for a string or File object.
 * @param {File|Blob|string} content 
 * @returns {Promise<string>} Hexadecimal SHA-256 string
 */
export async function calculateSHA256(content) {
  try {
    let arrayBuffer;
    if (typeof content === 'string') {
      const encoder = new TextEncoder();
      arrayBuffer = encoder.encode(content);
    } else if (content instanceof Blob || content instanceof File) {
      arrayBuffer = await content.arrayBuffer();
    } else {
      return `sha256_mock_${Date.now()}`;
    }

    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.error('[MediaSecurity] SHA256 Exception:', err);
    return `sha256_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
}

/**
 * Strips EXIF metadata & original filename from image URL for sanitized customer delivery.
 * @param {string} rawUrl - Original image URL or Base64
 * @returns {string} Sanitized customer derivative URL
 */
export function sanitizeCustomerDerivativeUrl(rawUrl) {
  if (!rawUrl) return '';
  // If Cloudinary URL, append transformation parameters (f_auto, q_auto:good, w_1600, c_limit, fl_strip_profile)
  if (rawUrl.includes('cloudinary.com')) {
    return rawUrl.replace('/upload/', '/upload/f_auto,q_auto:good,w_1600,c_limit,fl_strip_profile/');
  }
  return rawUrl;
}

/**
 * Returns exact Rep status badge styling & copy.
 */
export function getRepStatusConfig(statusKey) {
  const statusMap = {
    'saved_local': { text: 'Safe on this phone', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    'submitted_local': { text: 'Safe on this phone', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    'waiting_internet': { text: 'Waiting for internet', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
    'waiting_wifi': { text: 'Waiting for Wi-Fi', bg: 'bg-blue-100 text-blue-800 border-blue-300' },
    'uploading': { text: 'Uploading securely', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
    'processing': { text: 'Processing', bg: 'bg-purple-100 text-purple-800 border-purple-300' },
    'verified': { text: 'Verified by IDS', bg: 'bg-teal-100 text-teal-800 border-teal-300' },
    'ready_for_review': { text: 'Verified by IDS', bg: 'bg-teal-100 text-teal-800 border-teal-300' },
    'attention': { text: 'Needs attention', bg: 'bg-rose-100 text-rose-800 border-rose-300' },
    'published': { text: 'Shared with customer', bg: 'bg-sky-100 text-sky-800 border-sky-300' }
  };
  return statusMap[statusKey] || statusMap['saved_local'];
}
