import { InvalidPayloadError } from '@directus/errors';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AISettings } from '../../providers/types.js';
import { uploadToAnthropic, uploadToGoogle, uploadToOpenAI } from '../adapters/index.js';
import type { UploadedFile } from '../types.js';
import { uploadToProvider } from './upload-to-provider.js';

vi.mock('../adapters/index.js', () => ({
	uploadToOpenAI: vi.fn(),
	uploadToAnthropic: vi.fn(),
	uploadToGoogle: vi.fn(),
}));

describe('uploadToProvider', () => {
	const mockFile: UploadedFile = {
		filename: 'test.pdf',
		mimeType: 'application/pdf',
		data: Buffer.from('test content'),
	};

	const baseSettings: AISettings = {
		ai_openai_api_key: null,
		ai_anthropic_api_key: null,
		ai_google_api_key: null,
		ai_openrouter_api_key: null,
		ai_openai_compatible_api_key: null,
		ai_openai_compatible_base_url: null,
		ai_openai_compatible_name: null,
		ai_openai_compatible_models: null,
		ai_openai_compatible_headers: null,
		ai_openai_allowed_models: [],
		ai_anthropic_allowed_models: [],
		ai_google_allowed_models: [],
		ai_openrouter_models: [],
		ai_system_prompt: null,
	};

	beforeEach(() => {
		vi.mocked(uploadToOpenAI).mockResolvedValue({
			provider: 'openai',
			fileId: 'file-openai',
			filename: 'test.pdf',
			mimeType: 'application/pdf',
			sizeBytes: 12,
			expiresAt: null,
		});

		vi.mocked(uploadToAnthropic).mockResolvedValue({
			provider: 'anthropic',
			fileId: 'file-anthropic',
			filename: 'test.pdf',
			mimeType: 'application/pdf',
			sizeBytes: 12,
			expiresAt: null,
		});

		vi.mocked(uploadToGoogle).mockResolvedValue({
			provider: 'google',
			fileId: 'https://example.com/files/abc',
			filename: 'test.pdf',
			mimeType: 'application/pdf',
			sizeBytes: 12,
			expiresAt: '2025-01-03T00:00:00Z',
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('OpenAI', () => {
		it('should call uploadToOpenAI with correct arguments', async () => {
			const settings = { ...baseSettings, ai_openai_api_key: 'sk-openai-key' };

			await uploadToProvider(mockFile, 'openai', settings);

			expect(uploadToOpenAI).toHaveBeenCalledWith(mockFile, 'sk-openai-key');
		});

		it('should throw InvalidPayloadError when OpenAI API key not configured', async () => {
			await expect(uploadToProvider(mockFile, 'openai', baseSettings)).rejects.toThrow(InvalidPayloadError);

			await expect(uploadToProvider(mockFile, 'openai', baseSettings)).rejects.toThrow('OpenAI API key not configured');
		});
	});

	describe('Anthropic', () => {
		it('should call uploadToAnthropic with correct arguments', async () => {
			const settings = { ...baseSettings, ai_anthropic_api_key: 'sk-anthropic-key' };

			await uploadToProvider(mockFile, 'anthropic', settings);

			expect(uploadToAnthropic).toHaveBeenCalledWith(mockFile, 'sk-anthropic-key');
		});

		it('should throw InvalidPayloadError when Anthropic API key not configured', async () => {
			await expect(uploadToProvider(mockFile, 'anthropic', baseSettings)).rejects.toThrow(InvalidPayloadError);

			await expect(uploadToProvider(mockFile, 'anthropic', baseSettings)).rejects.toThrow(
				'Anthropic API key not configured',
			);
		});
	});

	describe('Google', () => {
		it('should call uploadToGoogle with correct arguments', async () => {
			const settings = { ...baseSettings, ai_google_api_key: 'google-api-key' };

			await uploadToProvider(mockFile, 'google', settings);

			expect(uploadToGoogle).toHaveBeenCalledWith(mockFile, 'google-api-key');
		});

		it('should throw InvalidPayloadError when Google API key not configured', async () => {
			await expect(uploadToProvider(mockFile, 'google', baseSettings)).rejects.toThrow(InvalidPayloadError);

			await expect(uploadToProvider(mockFile, 'google', baseSettings)).rejects.toThrow('Google API key not configured');
		});
	});

	describe('unsupported provider', () => {
		it('should throw InvalidPayloadError for unknown provider', async () => {
			await expect(uploadToProvider(mockFile, 'unknown' as any, baseSettings)).rejects.toThrow(InvalidPayloadError);

			await expect(uploadToProvider(mockFile, 'unknown' as any, baseSettings)).rejects.toThrow(
				'does not support file uploads',
			);
		});
	});
});
