import type { ProviderCapabilities, ProviderType } from './types.js';

export const PROVIDER_CAPABILITIES: Record<ProviderType, ProviderCapabilities> = {
	openai: {
		fileUpload: {
			supported: true,
			method: 'files-api',
			maxSize: 512_000_000,
		},
	},
	anthropic: {
		fileUpload: {
			supported: true,
			method: 'files-api',
			maxSize: 500_000_000,
			mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'],
		},
	},
	google: {
		fileUpload: {
			supported: true,
			method: 'files-api',
			maxSize: 2_000_000_000,
		},
	},
	'openai-compatible': {
		fileUpload: {
			supported: false,
			method: 'base64',
		},
	},
};
