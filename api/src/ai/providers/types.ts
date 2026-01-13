import type { OpenAICompatibleHeader, OpenAICompatibleModel, ProviderType } from '@directus/ai';

export interface ProviderConfig {
	type: ProviderType;
	apiKey: string;
	baseUrl?: string;
}

export interface ProviderCapabilities {
	fileUpload?: {
		supported: boolean;
		maxSize?: number;
		mimeTypes?: string[];
		method: 'files-api' | 'base64' | 'multipart';
	};
}

export interface AISettings {
	openaiApiKey: string | null;
	anthropicApiKey: string | null;
	googleApiKey: string | null;
	openaiCompatibleApiKey: string | null;
	openaiCompatibleBaseUrl: string | null;
	openaiCompatibleName: string | null;
	openaiCompatibleModels: OpenAICompatibleModel[] | null;
	openaiCompatibleHeaders: OpenAICompatibleHeader[] | null;
	openaiAllowedModels: string[] | null;
	anthropicAllowedModels: string[] | null;
	googleAllowedModels: string[] | null;
	systemPrompt: string | null;
}
