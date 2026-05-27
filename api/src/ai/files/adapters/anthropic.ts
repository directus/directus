import type { ProviderFileRef } from '@directus/ai';
import { fetchProvider } from '../lib/fetch-provider.js';
import type { UploadedFile } from '../types.js';

export async function uploadToAnthropic(file: UploadedFile, apiKey: string): Promise<ProviderFileRef> {
	const formData = new FormData();
	formData.append('file', new Blob([new Uint8Array(file.data)], { type: file.mimeType }), file.filename);

	const result = (await fetchProvider(
		'https://api.anthropic.com/v1/files',
		{
			method: 'POST',
			headers: {
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01',
				'anthropic-beta': 'files-api-2025-04-14',
			},
			body: formData,
		},
		'Anthropic',
	)) as { id?: string; filename?: string; mime_type?: string; size_bytes?: number };

	if (!result.id) {
		throw new Error('Anthropic upload returned unexpected response');
	}

	return {
		provider: 'anthropic',
		fileId: result.id,
		filename: result.filename ?? file.filename,
		mimeType: result.mime_type ?? file.mimeType,
		sizeBytes: result.size_bytes ?? file.data.length,
		expiresAt: null,
	};
}
