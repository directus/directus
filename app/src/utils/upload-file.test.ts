/**
 * Unit tests for upload-file.ts
 *
 * These tests directly test the uploadFile function to ensure
 * the onAfterResponse callback correctly guards against null header values.
 */

import { describe, expect, test, vi, beforeEach } from 'vitest';
import type { Upload, UploadOptions } from 'tus-js-client';

// Mock all dependencies before importing uploadFile
vi.mock('@/stores/server', () => ({
	useServerStore: vi.fn(),
}));

vi.mock('@/utils/get-root-path', () => ({
	getRootPath: vi.fn(() => '/'),
}));

vi.mock('@/api', () => ({
	default: {
		get: vi.fn(),
	},
}));

vi.mock('@/events', () => ({
	emitter: {
		emit: vi.fn(),
	},
	Events: {
		tusResumableUploadsChanged: 'tusResumableUploadsChanged',
		upload: 'upload',
	},
}));

vi.mock('@/lang', () => ({
	i18n: {
		global: {
			t: vi.fn((key: string) => key),
		},
	},
}));

vi.mock('@/utils/notify', () => ({
	notify: vi.fn(),
}));

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

// Capture the Upload constructor options
let capturedUploadOptions: UploadOptions | null = null;

vi.mock('tus-js-client', () => ({
	Upload: vi.fn().mockImplementation((_file: File, options: UploadOptions) => {
		capturedUploadOptions = options;

		return {
			start: vi.fn(),
			abort: vi.fn(),
			findPreviousUploads: vi.fn().mockResolvedValue([]),
		} as unknown as Upload;
	}),
}));

import { uploadFile } from './upload-file';
import { useServerStore } from '@/stores/server';

describe('uploadFile', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		capturedUploadOptions = null;

		// Setup default server store mock with TUS enabled
		vi.mocked(useServerStore).mockReturnValue({
			info: {
				uploads: {
					chunkSize: 1024,
				},
			},
		} as any);
	});

	describe('onAfterResponse callback', () => {
		test('should NOT assign fileInfo.id when Directus-File-Id header is missing (returns null)', async () => {
			const file = new File(['test'], 'test.txt', { type: 'text/plain' });

			// Start upload (don't await - it won't resolve in test)
			uploadFile(file);

			// Wait for Upload constructor to be called
			await vi.waitFor(() => {
				expect(capturedUploadOptions).not.toBeNull();
			});

			// Simulate response WITHOUT Directus-File-Id header
			const mockResponse = {
				getHeader: vi.fn((name: string) => {
					if (name === 'Directus-File-Id') return null;

					return null;
				}),
			};

			// Call the captured onAfterResponse
			capturedUploadOptions!.onAfterResponse!({} as any, mockResponse as any);

			// The callback should have been called
			expect(mockResponse.getHeader).toHaveBeenCalledWith('Directus-File-Id');
		});

		test('should assign fileInfo.id when Directus-File-Id header is present', async () => {
			const file = new File(['test'], 'test.txt', { type: 'text/plain' });
			const expectedFileId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

			// Start upload
			uploadFile(file);

			await vi.waitFor(() => {
				expect(capturedUploadOptions).not.toBeNull();
			});

			// Simulate response WITH Directus-File-Id header
			const mockResponse = {
				getHeader: vi.fn((name: string) => {
					if (name === 'Directus-File-Id') return expectedFileId;

					return null;
				}),
			};

			capturedUploadOptions!.onAfterResponse!({} as any, mockResponse as any);

			expect(mockResponse.getHeader).toHaveBeenCalledWith('Directus-File-Id');
		});

		test('onAfterResponse should guard against null values to prevent "null" string in metadata', async () => {
			const file = new File(['test'], 'test.txt', { type: 'text/plain' });

			uploadFile(file);

			await vi.waitFor(() => {
				expect(capturedUploadOptions).not.toBeNull();
			});

			// Get the metadata object that will be modified by onAfterResponse
			const metadata = capturedUploadOptions!.metadata as Record<string, any>;

			// Verify id is not set initially
			expect(metadata.id).toBeUndefined();

			// Call onAfterResponse with null header (simulating missing header)
			const mockResponseNull = {
				getHeader: vi.fn(() => null),
			};

			capturedUploadOptions!.onAfterResponse!({} as any, mockResponseNull as any);

			// After the fix: id should still be undefined, NOT null
			// This is what prevents the "null" string bug
			expect(metadata.id).not.toBe(null);
		});

		test('onAfterResponse should set id when header is present', async () => {
			const file = new File(['test'], 'test.txt', { type: 'text/plain' });
			const expectedFileId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

			uploadFile(file);

			await vi.waitFor(() => {
				expect(capturedUploadOptions).not.toBeNull();
			});

			const metadata = capturedUploadOptions!.metadata as Record<string, any>;

			// Call onAfterResponse with valid header
			const mockResponse = {
				getHeader: vi.fn(() => expectedFileId),
			};

			capturedUploadOptions!.onAfterResponse!({} as any, mockResponse as any);

			// id should now be set
			expect(metadata.id).toBe(expectedFileId);
		});
	});

	describe('TUS upload configuration', () => {
		test('should use server chunkSize when available', async () => {
			vi.mocked(useServerStore).mockReturnValue({
				info: {
					uploads: {
						chunkSize: 2048,
					},
				},
			} as any);

			const file = new File(['test'], 'test.txt', { type: 'text/plain' });

			uploadFile(file);

			await vi.waitFor(() => {
				expect(capturedUploadOptions).not.toBeNull();
			});

			expect(capturedUploadOptions!.chunkSize).toBe(2048);
		});

		test('should set removeFingerprintOnSuccess to true', async () => {
			const file = new File(['test'], 'test.txt', { type: 'text/plain' });

			uploadFile(file);

			await vi.waitFor(() => {
				expect(capturedUploadOptions).not.toBeNull();
			});

			expect(capturedUploadOptions!.removeFingerprintOnSuccess).toBe(true);
		});

		test('should set file metadata from file properties', async () => {
			const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });

			uploadFile(file);

			await vi.waitFor(() => {
				expect(capturedUploadOptions).not.toBeNull();
			});

			const metadata = capturedUploadOptions!.metadata as Record<string, any>;
			expect(metadata.filename_download).toBe('document.pdf');
			expect(metadata.type).toBe('application/pdf');
		});
	});
});
