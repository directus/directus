import type { ProviderFileRef, UploadedFile } from '../types.js';

export async function uploadToOpenAI(file: UploadedFile, apiKey: string): Promise<ProviderFileRef> {
	const formData = new FormData();
	formData.append('file', new Blob([new Uint8Array(file.data)], { type: file.mimeType }), file.filename);
	formData.append('purpose', 'user_data');

	const response = await fetch('https://api.openai.com/v1/files', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
		},
		body: formData,
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`OpenAI upload failed: ${error}`);
	}

	const result = await response.json();

	return {
		provider: 'openai',
		fileId: result.id,
		filename: file.filename,
		mimeType: file.mimeType,
		sizeBytes: file.data.length,
		expiresAt: null,
	};
}
