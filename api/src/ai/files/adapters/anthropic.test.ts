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

		expect(fetch).toHaveBeenCalledWith(
			'https://api.anthropic.com/v1/files',
			expect.objectContaining({
				method: 'POST',
				headers: {
					'x-api-key': 'sk-ant-test-key',
					'anthropic-version': '2023-06-01',
					'anthropic-beta': 'files-api-2025-04-14',
				},
				body: expect.any(FormData),
			}),
		);
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
				status: 429,
				text: () => Promise.resolve('Rate limit exceeded'),
			}),
		);

		await expect(uploadToAnthropic(mockFile, mockApiKey)).rejects.toThrow(
			'Anthropic upload failed: Rate limit exceeded',
		);
	});

	it('should throw error when response is missing file ID', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ type: 'file' }),
			}),
		);

		await expect(uploadToAnthropic(mockFile, mockApiKey)).rejects.toThrow(
			'Anthropic upload returned unexpected response',
		);
	});

	it('should throw timeout error when upload times out', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockRejectedValue(Object.assign(new Error('The operation was aborted'), { name: 'TimeoutError' })),
		);

		await expect(uploadToAnthropic(mockFile, mockApiKey)).rejects.toThrow('Anthropic upload timed out after 120s');
	});

	it('should throw error when response JSON is invalid', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.reject(new SyntaxError('Unexpected token')),
			}),
		);

		await expect(uploadToAnthropic(mockFile, mockApiKey)).rejects.toThrow(
			'Anthropic upload succeeded but returned invalid response',
		);
	});

	it('should handle response.text() failure in error path', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				text: () => Promise.reject(new Error('body unavailable')),
			}),
		);

		await expect(uploadToAnthropic(mockFile, mockApiKey)).rejects.toThrow('Anthropic upload failed: HTTP 500');
	});
});
