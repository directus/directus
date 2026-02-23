import type { ProviderFileRef, UploadedFile } from '../types.js';

const UPLOAD_TIMEOUT = 120_000;

export async function uploadToGoogle(file: UploadedFile, apiKey: string): Promise<ProviderFileRef> {
	const baseUrl = 'https://generativelanguage.googleapis.com/upload/v1beta/files';

	let startResponse: Response;

	// Step 1: Start resumable upload
	try {
		startResponse = await fetch(baseUrl, {
			method: 'POST',
			headers: {
				'x-goog-api-key': apiKey,
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
	} catch (error) {
		if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
			throw new Error(`Google upload timed out after ${UPLOAD_TIMEOUT / 1000}s`);
		}

		throw error;
	}

	if (!startResponse.ok) {
		const error = await startResponse.text().catch(() => `HTTP ${startResponse.status}`);
		throw new Error(`Google upload init failed: ${error}`);
	}

	const uploadUrl = startResponse.headers.get('X-Goog-Upload-URL');

	if (!uploadUrl) {
		throw new Error('Google upload init did not return upload URL');
	}

	let uploadResponse: Response;

	// Step 2: Upload the file data
	try {
		uploadResponse = await fetch(uploadUrl, {
			method: 'POST',
			headers: {
				'X-Goog-Upload-Command': 'upload, finalize',
				'X-Goog-Upload-Offset': '0',
				'Content-Type': file.mimeType,
			},
			body: new Uint8Array(file.data),
			signal: AbortSignal.timeout(UPLOAD_TIMEOUT),
		});
	} catch (error) {
		if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
			throw new Error(`Google upload timed out after ${UPLOAD_TIMEOUT / 1000}s`);
		}

		throw error;
	}

	if (!uploadResponse.ok) {
		const error = await uploadResponse.text().catch(() => `HTTP ${uploadResponse.status}`);
		throw new Error(`Google upload failed: ${error}`);
	}

	let result;

	try {
		result = await uploadResponse.json();
	} catch {
		throw new Error('Google upload succeeded but returned invalid response');
	}

	const fileData = result.file;

	if (!fileData?.uri) {
		throw new Error('Google upload returned unexpected response');
	}

	const parsedSize = parseInt(fileData.sizeBytes, 10);

	return {
		provider: 'google',
		fileId: fileData.uri,
		filename: fileData.displayName ?? file.filename,
		mimeType: fileData.mimeType ?? file.mimeType,
		sizeBytes: Number.isNaN(parsedSize) ? file.data.length : parsedSize,
		expiresAt: fileData.expirationTime ?? null,
	};
}
