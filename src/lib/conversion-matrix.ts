// Conversion compatibility matrix
// Defines which file types can be converted to which formats

export type FileCategory = 'image' | 'video' | 'audio' | 'document' | 'other';

export interface FormatInfo {
  id: string;
  label: string;
  category: FileCategory;
  mimeTypes: string[];
  extensions: string[];
}

export const allFormats: FormatInfo[] = [
  // Images
  { id: "jpg", label: "JPG", category: "image", mimeTypes: ["image/jpeg"], extensions: ["jpg", "jpeg"] },
  { id: "png", label: "PNG", category: "image", mimeTypes: ["image/png"], extensions: ["png"] },
  { id: "webp", label: "WebP", category: "image", mimeTypes: ["image/webp"], extensions: ["webp"] },
  { id: "gif", label: "GIF", category: "image", mimeTypes: ["image/gif"], extensions: ["gif"] },
  { id: "tiff", label: "TIFF", category: "image", mimeTypes: ["image/tiff"], extensions: ["tiff", "tif"] },
  { id: "avif", label: "AVIF", category: "image", mimeTypes: ["image/avif"], extensions: ["avif"] },
  { id: "svg", label: "SVG", category: "image", mimeTypes: ["image/svg+xml"], extensions: ["svg"] },
  
  // Videos
  { id: "mp4", label: "MP4", category: "video", mimeTypes: ["video/mp4"], extensions: ["mp4"] },
  { id: "mov", label: "MOV", category: "video", mimeTypes: ["video/quicktime"], extensions: ["mov"] },
  { id: "avi", label: "AVI", category: "video", mimeTypes: ["video/x-msvideo"], extensions: ["avi"] },
  { id: "mkv", label: "MKV", category: "video", mimeTypes: ["video/x-matroska"], extensions: ["mkv"] },
  { id: "webm", label: "WebM", category: "video", mimeTypes: ["video/webm"], extensions: ["webm"] },
  
  // Audio
  { id: "mp3", label: "MP3", category: "audio", mimeTypes: ["audio/mpeg", "audio/mp3"], extensions: ["mp3"] },
  { id: "wav", label: "WAV", category: "audio", mimeTypes: ["audio/wav", "audio/wave"], extensions: ["wav"] },
  { id: "aac", label: "AAC", category: "audio", mimeTypes: ["audio/aac"], extensions: ["aac"] },
  { id: "flac", label: "FLAC", category: "audio", mimeTypes: ["audio/flac"], extensions: ["flac"] },
  { id: "ogg", label: "OGG", category: "audio", mimeTypes: ["audio/ogg"], extensions: ["ogg", "oga"] },
  
  // Documents
  { id: "pdf", label: "PDF", category: "document", mimeTypes: ["application/pdf"], extensions: ["pdf"] },
  { id: "docx", label: "DOCX", category: "document", mimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"], extensions: ["docx"] },
  { id: "txt", label: "TXT", category: "document", mimeTypes: ["text/plain"], extensions: ["txt"] },
  { id: "rtf", label: "RTF", category: "document", mimeTypes: ["application/rtf", "text/rtf"], extensions: ["rtf"] },
];

// Conversion compatibility matrix
// Format: sourceFormat -> [targetFormats]
const conversionMatrix: Record<string, string[]> = {
  // Image conversions
  "jpg": ["pdf", "jpg", "png", "webp", "tiff", "avif", "gif"],
  "jpeg": ["pdf", "jpg", "png", "webp", "tiff", "avif", "gif"],
  "png": ["pdf", "jpg", "png", "webp", "tiff", "avif", "gif"],
  "webp": ["pdf", "jpg", "png", "webp", "tiff", "avif", "gif"],
  "gif": ["pdf", "jpg", "png", "webp", "tiff", "avif", "gif"],
  "tiff": ["pdf", "jpg", "png", "webp", "tiff", "avif", "gif"],
  "tif": ["pdf", "jpg", "png", "webp", "tiff", "avif", "gif"],
  "avif": ["pdf", "jpg", "png", "webp", "tiff", "avif", "gif"],
  "svg": ["pdf", "jpg", "png", "webp", "tiff", "avif", "gif", "svg"],
  
  // Video conversions
  "mp4": ["mp4", "mov", "avi", "mkv", "webm"],
  "mov": ["mp4", "mov", "avi", "mkv", "webm"],
  "avi": ["mp4", "mov", "avi", "mkv", "webm"],
  "mkv": ["mp4", "mov", "avi", "mkv", "webm"],
  "webm": ["mp4", "mov", "avi", "mkv", "webm"],
  
  // Audio conversions
  "mp3": ["mp3", "wav", "aac", "flac", "ogg"],
  "wav": ["mp3", "wav", "aac", "flac", "ogg"],
  "aac": ["mp3", "wav", "aac", "flac", "ogg"],
  "flac": ["mp3", "wav", "aac", "flac", "ogg"],
  "ogg": ["mp3", "wav", "aac", "flac", "ogg"],
  "oga": ["mp3", "wav", "aac", "flac", "ogg"],
  
  // Document conversions
  "pdf": ["pdf", "docx", "txt", "rtf"],
  "docx": ["pdf", "docx", "txt", "rtf"],
  "txt": ["pdf", "docx", "txt", "rtf"],
  "rtf": ["pdf", "docx", "txt", "rtf"],
};

/**
 * Get the file extension from a filename or file type
 */
export function getFileExtension(file: File | string): string {
  if (typeof file === 'string') {
    const match = file.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : '';
  }
  
  // Try to get from filename first
  if (file.name) {
    const match = file.name.match(/\.([^.]+)$/);
    if (match) return match[1].toLowerCase();
  }
  
  // Fallback to MIME type
  if (file.type) {
    const format = allFormats.find(f => 
      f.mimeTypes.some(mt => file.type.includes(mt.split('/')[1]))
    );
    if (format) return format.extensions[0];
  }
  
  return '';
}

/**
 * Get the source format ID from a file
 */
export function getSourceFormat(file: File): string {
  const ext = getFileExtension(file);
  if (ext) {
    // Normalize common extensions
    if (ext === 'jpeg') return 'jpg';
    if (ext === 'tif') return 'tiff';
    if (ext === 'oga') return 'ogg';
    return ext;
  }
  
  // Fallback to MIME type detection
  if (file.type.startsWith('image/')) {
    if (file.type.includes('jpeg')) return 'jpg';
    if (file.type.includes('png')) return 'png';
    if (file.type.includes('webp')) return 'webp';
    if (file.type.includes('gif')) return 'gif';
    if (file.type.includes('tiff')) return 'tiff';
    if (file.type.includes('avif')) return 'avif';
    if (file.type.includes('svg')) return 'svg';
  }
  
  if (file.type.startsWith('video/')) {
    if (file.type.includes('mp4')) return 'mp4';
    if (file.type.includes('quicktime')) return 'mov';
    if (file.type.includes('x-msvideo')) return 'avi';
    if (file.type.includes('matroska')) return 'mkv';
    if (file.type.includes('webm')) return 'webm';
  }
  
  if (file.type.startsWith('audio/')) {
    if (file.type.includes('mpeg') || file.type.includes('mp3')) return 'mp3';
    if (file.type.includes('wav') || file.type.includes('wave')) return 'wav';
    if (file.type.includes('aac')) return 'aac';
    if (file.type.includes('flac')) return 'flac';
    if (file.type.includes('ogg')) return 'ogg';
  }
  
  if (file.type.includes('pdf')) return 'pdf';
  if (file.type.includes('wordprocessingml')) return 'docx';
  if (file.type.includes('text/plain')) return 'txt';
  if (file.type.includes('rtf')) return 'rtf';
  
  return '';
}

/**
 * Check if a conversion is supported
 */
export function isConversionSupported(sourceFormat: string, targetFormat: string): boolean {
  const supported = conversionMatrix[sourceFormat.toLowerCase()];
  if (!supported) return false;
  return supported.includes(targetFormat.toLowerCase());
}

/**
 * Get all supported target formats for a source format
 */
export function getSupportedTargetFormats(sourceFormat: string): string[] {
  return conversionMatrix[sourceFormat.toLowerCase()] || [];
}

/**
 * Generate output filename with original name and new extension
 */
export function generateOutputFilename(originalFile: File, targetFormat: string): string {
  const originalName = originalFile.name;
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  const formatInfo = allFormats.find(f => f.id === targetFormat.toLowerCase());
  const extension = formatInfo?.extensions[0] || targetFormat.toLowerCase();
  return `${nameWithoutExt}.${extension}`;
}
