import api from './api';

export const uploadService = {
  // Upload image, video, or audio
  uploadMedia: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post('/api/upload/media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percent);
        }
      },
    });

    return data; // { url, path, mediaType, bucket }
  },

  // Delete uploaded file
  deleteMedia: (bucket, path) =>
    api.delete('/api/upload/media', { data: { bucket, path } }),

  // Validate file before uploading
  validateFile: (file) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm',
      'audio/mpeg', 'audio/ogg',
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not supported' };
    }
    if (file.size > maxSize) {
      return { valid: false, error: 'File must be under 10MB' };
    }
    return { valid: true };
  },
};