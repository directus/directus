import type { ProviderFileRef, UploadedFile } from '../types.js';

const UPLOAD_TIMEOUT = 120_000;

export async function uploadToOpenAI(file: UploadedFile, apiKey: string): Promise<ProviderFileRef> {
	const formData = new FormData();
	formData.append('file', new Blob([new Uint8Array(file.data)], { type: file.mimeType }), file.filename);
	formData.append('purpose', 'user_data');

	let response: Response;

	try {
		response = await fetch('https://api.openai.com/v1/files', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
			},
			body: formData,
			signal: AbortSignal.timeout(UPLOAD_TIMEOUT),
		});
	} catch (error) {
		if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
			throw new Error(`OpenAI upload timed out after ${UPLOAD_TIMEOUT / 1000}s`);
		}

		throw error;
	}

	if (!response.ok) {
		const error = await response.text().catch(() => `HTTP ${response.status}`);
		throw new Error(`OpenAI upload failed: ${error}`);
	}

	let result;

	try {
		result = await response.json();
	} catch {
		throw new Error('OpenAI upload succeeded but returned invalid response');
	}

	if (!result.id) {
		throw new Error('OpenAI upload returned unexpected response');
	}

	return {
		provider: 'openai',
		fileId: result.id,
		filename: file.filename,
		mimeType: file.mimeType,
		sizeBytes: result.bytes ?? file.data.length,
		expiresAt: null,
	};
}
