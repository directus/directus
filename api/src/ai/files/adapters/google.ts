import type { ProviderFileRef, UploadedFile } from '../types.js';

const UPLOAD_TIMEOUT = 120_000;

export async function uploadToGoogle(file: UploadedFile, apiKey: string): Promise<ProviderFileRef> {
	const baseUrl = 'https://generativelanguage.googleapis.com/upload/v1beta/files';

	// Step 1: Start resumable upload
	const startResponse = await fetch(`${baseUrl}?key=${apiKey}`, {
		method: 'POST',
		headers: {
			'X-Goog-Upload-Protocol': 'resumable',
			'X-Goog-Upload-Command': 'start',
			'X-Goog-Upload-Header-Content-Length': String(file.data.length),
			'X-Goog-Upload-Header-Content-Type': file.mimeType,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			file: { display_name: file.filename },
		}),
		signal: AbortSignal.timeout(UPLOAD_TIMEOUT),
	});

	if (!startResponse.ok) {
		const error = await startResponse.text().catch(() => `HTTP ${startResponse.status}`);
		throw new Error(`Google upload init failed: ${error}`);
	}

	const uploadUrl = startResponse.headers.get('X-Goog-Upload-URL');

	if (!uploadUrl) {
		throw new Error('Google upload init did not return upload URL');
	}

	// Step 2: Upload the file data
	const uploadResponse = await fetch(uploadUrl, {
		method: 'POST',
		headers: {
			'X-Goog-Upload-Command': 'upload, finalize',
			'X-Goog-Upload-Offset': '0',
			'Content-Type': file.mimeType,
		},
		body: new Uint8Array(file.data),
		signal: AbortSignal.timeout(UPLOAD_TIMEOUT),
	});

	if (!uploadResponse.ok) {
		const error = await uploadResponse.text().catch(() => `HTTP ${uploadResponse.status}`);
		throw new Error(`Google upload failed: ${error}`);
	}

	const result = await uploadResponse.json();
	const fileData = result.file;

	if (!fileData?.uri) {
		throw new Error('Google upload returned unexpected response');
	}

	return {
		provider: 'google',
		fileId: fileData.uri,
		filename: fileData.displayName,
		mimeType: fileData.mimeType,
		sizeBytes: parseInt(fileData.sizeBytes, 10) || file.data.length,
		expiresAt: fileData.expirationTime ?? null,
	};
}
