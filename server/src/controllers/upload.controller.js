const { supabaseAdmin } = require('../config/supabase');
const { randomUUID } = require('crypto');

// POST /api/upload/media
const uploadMedia = async (request, reply) => {
  try {
    const data = await request.file();

    if (!data) {
      return reply.code(400).send({ error: 'No file provided' });
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm',
      'audio/mpeg', 'audio/ogg', 'audio/webm',
    ];

    if (!allowedTypes.includes(data.mimetype)) {
      return reply.code(400).send({ error: `File type '${data.mimetype}' not allowed` });
    }

    const buffer   = await data.toBuffer();
    const ext      = data.filename.split('.').pop();
    const fileName = `${randomUUID()}.${ext}`;

    // Determine storage bucket by type
    let bucket    = 'images';
    let mediaType = 'image';
    if (data.mimetype.startsWith('video')) { bucket = 'videos'; mediaType = 'video'; }
    if (data.mimetype.startsWith('audio')) { bucket = 'audio';  mediaType = 'audio'; }

    // Upload to Supabase Storage
    const { data: uploaded, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: data.mimetype,
        upsert: false,
      });

    if (error) {
      return reply.code(500).send({ error: 'Upload failed', message: error.message });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return reply.send({
      url: urlData.publicUrl,
      path: uploaded.path,
      mediaType,
      bucket,
    });
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: 'Upload failed', message: err.message });
  }
};

// DELETE /api/upload/media
const deleteMedia = async (request, reply) => {
  try {
    const { bucket, path } = request.body;

    const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);
    if (error) return reply.code(500).send({ error: error.message });

    return reply.send({ message: 'File deleted successfully' });
  } catch (err) {
    return reply.code(500).send({ error: err.message });
  }
};

module.exports = { uploadMedia, deleteMedia };