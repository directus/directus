import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UploadedFile } from '../types.js';
import { uploadToGoogle } from './google.js';

describe('uploadToGoogle', () => {
	const mockFile: UploadedFile = {
		filename: 'test.pdf',
		mimeType: 'application/pdf',
		data: Buffer.from('test content'),
	};

	const mockApiKey = 'google-api-key';

	beforeEach(() => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockImplementation((url: string) => {
				// Step 1: Start resumable upload
				if (url.includes('generativelanguage.googleapis.com/upload/v1beta/files')) {
					return Promise.resolve({
						ok: true,
						headers: {
							get: (name: string) =>
								name === 'X-Goog-Upload-URL' ? 'https://upload.example.com/upload-session' : null,
						},
					});
				}

				// Step 2: Upload file data
				if (url.includes('upload.example.com')) {
					return Promise.resolve({
						ok: true,
						json: () =>
							Promise.resolve({
								file: {
									name: 'files/abc-123',
									uri: 'https://generativelanguage.googleapis.com/v1beta/files/abc-123',
									displayName: 'test.pdf',
									mimeType: 'application/pdf',
									sizeBytes: '12',
									expirationTime: '2025-01-03T00:00:00Z',
									state: 'ACTIVE',
								},
							}),
					});
				}

				return Promise.reject(new Error('Unknown URL'));
			}),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('should upload file to Google and return file reference', async () => {
		const result = await uploadToGoogle(mockFile, mockApiKey);

		expect(result).toEqual({
			provider: 'google',
			fileId: 'https://generativelanguage.googleapis.com/v1beta/files/abc-123',
			filename: 'test.pdf',
			mimeType: 'application/pdf',
			sizeBytes: 12,
			expiresAt: '2025-01-03T00:00:00Z',
		});
	});

	it('should start resumable upload with correct headers', async () => {
		await uploadToGoogle(mockFile, mockApiKey);

		const calls = vi.mocked(fetch).mock.calls;
		const initCall = calls[0];

		expect(initCall?.[0]).toBe('https://generativelanguage.googleapis.com/upload/v1beta/files');

		expect(initCall?.[1]).toMatchObject({
			method: 'POST',
			headers: {
				'x-goog-api-key': 'google-api-key',
				'X-Goog-Upload-Protocol': 'resumable',
				'X-Goog-Upload-Command': 'start',
				'X-Goog-Upload-Header-Content-Length': '12',
				'X-Goog-Upload-Header-Content-Type': 'application/pdf',
				'Content-Type': 'application/json',
			},
		});
	});

	it('should upload file data to returned upload URL', async () => {
		await uploadToGoogle(mockFile, mockApiKey);

		const calls = vi.mocked(fetch).mock.calls;
		const uploadCall = calls[1];

		expect(uploadCall?.[0]).toBe('https://upload.example.com/upload-session');

		expect(uploadCall?.[1]).toMatchObject({
			method: 'POST',
			headers: {
				'X-Goog-Upload-Command': 'upload, finalize',
				'X-Goog-Upload-Offset': '0',
				'Content-Type': 'application/pdf',
			},
		});
	});

	it('should throw error when init fails', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				text: () => Promise.resolve('Invalid API key'),
			}),
		);

		await expect(uploadToGoogle(mockFile, mockApiKey)).rejects.toThrow('Google upload init failed: Invalid API key');
	});

	it('should throw error when upload URL is missing', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				headers: {
					get: () => null,
				},
			}),
		);

		await expect(uploadToGoogle(mockFile, mockApiKey)).rejects.toThrow('Google upload init did not return upload URL');
	});

	it('should throw error when upload fails', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockImplementation((url: string) => {
				if (url.includes('generativelanguage.googleapis.com')) {
					return Promise.resolve({
						ok: true,
						headers: {
							get: () => 'https://upload.example.com/session',
						},
					});
				}

				return Promise.resolve({
					ok: false,
					text: () => Promise.resolve('Upload failed'),
				});
			}),
		);

		await expect(uploadToGoogle(mockFile, mockApiKey)).rejects.toThrow('Google upload failed: Upload failed');
	});

	it('should throw error when response is missing file data', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockImplementation((url: string) => {
				if (url.includes('generativelanguage.googleapis.com/upload/v1beta/files')) {
					return Promise.resolve({
						ok: true,
						headers: {
							get: () => 'https://upload.example.com/session',
						},
					});
				}

				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ file: {} }),
				});
			}),
		);

		await expect(uploadToGoogle(mockFile, mockApiKey)).rejects.toThrow('Google upload returned unexpected response');
	});

	it('should fall back to local buffer length when sizeBytes is missing', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockImplementation((url: string) => {
				if (url.includes('generativelanguage.googleapis.com/upload/v1beta/files')) {
					return Promise.resolve({
						ok: true,
						headers: {
							get: () => 'https://upload.example.com/session',
						},
					});
				}

				return Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							file: {
								uri: 'https://example.com/files/abc',
								displayName: 'test.pdf',
								mimeType: 'application/pdf',
							},
						}),
				});
			}),
		);

		const result = await uploadToGoogle(mockFile, mockApiKey);
		expect(result.sizeBytes).toBe(mockFile.data.length);
	});

	it('should throw timeout error when init request times out', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockRejectedValue(Object.assign(new Error('The operation was aborted'), { name: 'TimeoutError' })),
		);

		await expect(uploadToGoogle(mockFile, mockApiKey)).rejects.toThrow('Google upload timed out after 120s');
	});

	it('should throw timeout error when upload request times out', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockImplementation((url: string) => {
				if (url.includes('generativelanguage.googleapis.com')) {
					return Promise.resolve({
						ok: true,
						headers: {
							get: () => 'https://upload.example.com/session',
						},
					});
				}

				return Promise.reject(Object.assign(new Error('The operation was aborted'), { name: 'TimeoutError' }));
			}),
		);

		await expect(uploadToGoogle(mockFile, mockApiKey)).rejects.toThrow('Google upload timed out after 120s');
	});

	it('should throw error when response JSON is invalid', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockImplementation((url: string) => {
				if (url.includes('generativelanguage.googleapis.com/upload/v1beta/files')) {
					return Promise.resolve({
						ok: true,
						headers: {
							get: () => 'https://upload.example.com/session',
						},
					});
				}

				return Promise.resolve({
					ok: true,
					json: () => Promise.reject(new SyntaxError('Unexpected token')),
				});
			}),
		);

		await expect(uploadToGoogle(mockFile, mockApiKey)).rejects.toThrow(
			'Google upload succeeded but returned invalid response',
		);
	});

	it('should handle missing expirationTime', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockImplementation((url: string) => {
				if (url.includes('generativelanguage.googleapis.com/upload/v1beta/files')) {
					return Promise.resolve({
						ok: true,
						headers: {
							get: () => 'https://upload.example.com/session',
						},
					});
				}

				return Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							file: {
								uri: 'https://example.com/files/abc',
								displayName: 'test.pdf',
								mimeType: 'application/pdf',
								sizeBytes: '12',
							},
						}),
				});
			}),
		);

		const result = await uploadToGoogle(mockFile, mockApiKey);
		expect(result.expiresAt).toBeNull();
	});
});
