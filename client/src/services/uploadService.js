export const uploadService = {
  /**
   * Convert an image file to a base64 data URL on the client.
   * No server upload needed — the data URL is saved directly as avatar_url.
   * onProgress is called with 0 → 100 to keep the UI happy.
   */
  uploadMedia: (file, onProgress) =>
    new Promise((resolve, reject) => {
      onProgress?.(10);
      const reader = new FileReader();
      reader.onload = (e) => {
        onProgress?.(100);
        resolve({ url: e.target.result, mediaType: 'image' });
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    }),

  // Validate file before uploading (images only for avatars)
  validateFile: (file) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    ];
    const maxSize = 5 * 1024 * 1024; // 5 MB — base64 adds ~33% overhead

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only JPEG, PNG, WebP or GIF images are allowed' };
    }
    if (file.size > maxSize) {
      return { valid: false, error: 'Image must be under 5 MB' };
    }
    return { valid: true };
  },
};