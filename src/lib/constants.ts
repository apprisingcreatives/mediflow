export const DOCUMENT_UPLOAD_DEFAULTS = {
  maxFileSizeMb: 10,
  maxFileSizeBytes: 10 * 1024 * 1024,
  allowedMimeTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ],
  allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.webp'],
};
