const fs = require('fs');

const cloudName = 'olbzwhrw';
const uploadPreset = 'unsigned_uploads';

(async () => {
  console.log('Testing Cloudinary upload for Cloud Name:', cloudName);
  console.log('Using Upload Preset:', uploadPreset);

  // Small 1x1 transparent GIF base64 sample
  const sampleBase64 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  try {
    const formData = new FormData();
    formData.append('file', sampleBase64);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'ids_pulse/test');

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const json = await res.json();
    if (res.ok) {
      console.log('✅ CLOUDINARY UPLOAD SUCCESSFUL!');
      console.log('Secure URL:', json.secure_url);
      console.log('Public ID:', json.public_id);
    } else {
      console.error('❌ Cloudinary Upload Error:', json.error?.message || json);
    }
  } catch (err) {
    console.error('Exception during Cloudinary upload test:', err.message || err);
  }
})();
