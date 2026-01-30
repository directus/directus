import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UploadedFile } from '../types.js';
import { uploadToAnthropic } from './anthropic.js';

describe('uploadToAnthropic', () => {
	const mockFile: UploadedFile = {
		filename: 'test.pdf',
		mimeType: 'application/pdf',
		data: Buffer.from('test content'),
	};

	const mockApiKey = 'sk-ant-test-key';

	beforeEach(() => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () =>
					Promise.resolve({
						id: 'file_011CNha8iCJcU1wXNR6q4V8w',
						type: 'file',
						filename: 'test.pdf',
						mime_type: 'application/pdf',
						size_bytes: 12,
						created_at: '2025-01-01T00:00:00Z',
					}),
			}),
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('should upload file to Anthropic and return file reference', async () => {
		const result = await uploadToAnthropic(mockFile, mockApiKey);

		expect(result).toEqual({
			provider: 'anthropic',
			fileId: 'file_011CNha8iCJcU1wXNR6q4V8w',
			filename: 'test.pdf',
			mimeType: 'application/pdf',
			sizeBytes: 12,
			expiresAt: null,
		});
	});

	it('should make POST request to Anthropic files endpoint with correct headers', async () => {
		await uploadToAnthropic(mockFile, mockApiKey);

		expect(fetch).toHaveBeenCalledWith('https://api.anthropic.com/v1/files', {
			method: 'POST',
			headers: {
				'x-api-key': 'sk-ant-test-key',
				'anthropic-version': '2023-06-01',
				'anthropic-beta': 'files-api-2025-04-14',
			},
			body: expect.any(FormData),
		});
	});

	it('should include beta header for files API', async () => {
		await uploadToAnthropic(mockFile, mockApiKey);

		const call = vi.mocked(fetch).mock.calls[0];
		const headers = call?.[1]?.headers as Record<string, string>;

		expect(headers['anthropic-beta']).toBe('files-api-2025-04-14');
	});

	it('should throw error when upload fails', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				text: () => Promise.resolve('Rate limit exceeded'),
			}),
		);

		await expect(uploadToAnthropic(mockFile, mockApiKey)).rejects.toThrow(
			'Anthropic upload failed: Rate limit exceeded',
		);
	});
});
