export const AI_ALLOWED_MIME_TYPES = [
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'application/pdf',
	'text/plain',
	'audio/mpeg',
	'audio/wav',
	'video/mp4',
] as const;

/** The image types both OpenAI and Google take as reference images in the AI Image flow operation. */
export const AI_IMAGE_REFERENCE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** Largest file AI features read, per upload and per request. Files are held in memory while a request is built. */
export const AI_MAX_FILE_SIZE: number = 50 * 1024 * 1024;

export type AiAllowedMimeType = (typeof AI_ALLOWED_MIME_TYPES)[number];
