export type FileUploadProvider = 'openai' | 'anthropic' | 'google';

export interface UploadedFile {
	filename: string;
	mimeType: string;
	data: Buffer;
}

export interface ProviderFileRef {
	provider: FileUploadProvider;
	fileId: string;
	filename: string;
	mimeType: string;
	sizeBytes: number;
	expiresAt: string | null;
}
