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

export type AiAllowedMimeType = (typeof AI_ALLOWED_MIME_TYPES)[number];
