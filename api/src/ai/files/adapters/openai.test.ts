import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UploadedFile } from '../types.js';
import { uploadToOpenAI } from './openai.js';

describe('uploadToOpenAI', () => {
	const mockFile: UploadedFile = {
		filename: 'test.pdf',
		mimeType: 'application/pdf',
		data: Buffer.from('test content'),
	};

	const mockApiKey = 'sk-test-key';

	beforeEach(() => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () =>
					Promise.resolve({
						id: 'file-abc123',
						object: 'file',
						bytes: 12,
						filename: 'test.pdf',
						purpose: 'user_data',
						status: 'processed',
					}),
			}),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('should upload file to OpenAI and return file reference', async () => {
		const result = await uploadToOpenAI(mockFile, mockApiKey);

		expect(result).toEqual({
			provider: 'openai',
			fileId: 'file-abc123',
			filename: 'test.pdf',
			mimeType: 'application/pdf',
			sizeBytes: 12,
			expiresAt: null,
		});
	});

	it('should make POST request to OpenAI files endpoint', async () => {
		await uploadToOpenAI(mockFile, mockApiKey);

		expect(fetch).toHaveBeenCalledWith('https://api.openai.com/v1/files', {
			method: 'POST',
			headers: {
				Authorization: 'Bearer sk-test-key',
			},
			body: expect.any(FormData),
		});
	});

	it('should include purpose field as user_data', async () => {
		await uploadToOpenAI(mockFile, mockApiKey);

		const call = vi.mocked(fetch).mock.calls[0];
		const formData = call?.[1]?.body as FormData;

		expect(formData.get('purpose')).toBe('user_data');
	});

	it('should throw error when upload fails', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				text: () => Promise.resolve('Invalid API key'),
			}),
		);

		await expect(uploadToOpenAI(mockFile, mockApiKey)).rejects.toThrow('OpenAI upload failed: Invalid API key');
	});
});
