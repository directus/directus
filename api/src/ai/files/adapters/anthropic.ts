import type { ProviderFileRef, UploadedFile } from '../types.js';

const UPLOAD_TIMEOUT = 120_000;

export async function uploadToAnthropic(file: UploadedFile, apiKey: string): Promise<ProviderFileRef> {
	const formData = new FormData();
	formData.append('file', new Blob([new Uint8Array(file.data)], { type: file.mimeType }), file.filename);

	let response: Response;

	try {
		response = await fetch('https://api.anthropic.com/v1/files', {
			method: 'POST',
			headers: {
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01',
				'anthropic-beta': 'files-api-2025-04-14',
			},
			body: formData,
			signal: AbortSignal.timeout(UPLOAD_TIMEOUT),
		});
	} catch (error) {
		if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
			throw new Error(`Anthropic upload timed out after ${UPLOAD_TIMEOUT / 1000}s`);
		}

		throw error;
	}

	if (!response.ok) {
		const error = await response.text().catch(() => `HTTP ${response.status}`);
		throw new Error(`Anthropic upload failed: ${error}`);
	}

	let result;

	try {
		result = await response.json();
	} catch {
		throw new Error('Anthropic upload succeeded but returned invalid response');
	}

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
