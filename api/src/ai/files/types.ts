import type { ProviderFileRef, StandardProviderType } from '@directus/ai';

export type { ProviderFileRef };

export type FileUploadProvider = StandardProviderType;

export interface UploadedFile {
	filename: string;
	mimeType: string;
	data: Buffer;
}
