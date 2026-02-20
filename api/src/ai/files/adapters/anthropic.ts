import type { ProviderFileRef, UploadedFile } from '../types.js';

const UPLOAD_TIMEOUT = 120_000;

export async function uploadToAnthropic(file: UploadedFile, apiKey: string): Promise<ProviderFileRef> {
	const formData = new FormData();
	formData.append('file', new Blob([new Uint8Array(file.data)], { type: file.mimeType }), file.filename);

	const response = await fetch('https://api.anthropic.com/v1/files', {
		method: 'POST',
		headers: {
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01',
			'anthropic-beta': 'files-api-2025-04-14',
		},
		body: formData,
		signal: AbortSignal.timeout(UPLOAD_TIMEOUT),
	});

	if (!response.ok) {
		const error = await response.text().catch(() => `HTTP ${response.status}`);
		throw new Error(`Anthropic upload failed: ${error}`);
	}

	const result = await response.json();

	if (!result.id) {
		throw new Error('Anthropic upload returned unexpected response');
	}

	return {
		provider: 'anthropic',
		fileId: result.id,
		filename: result.filename,
		mimeType: result.mime_type,
		sizeBytes: result.size_bytes,
		expiresAt: null,
	};
}
