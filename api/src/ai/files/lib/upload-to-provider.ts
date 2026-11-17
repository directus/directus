import type { FileUploadProviderType, ProviderFileRef } from '@directus/ai';
import { InvalidPayloadError } from '@directus/errors';
import type { AISettings } from '../../providers/types.js';
import { uploadToAnthropic, uploadToGoogle, uploadToOpenAI } from '../adapters/index.js';
import type { UploadedFile } from '../types.js';

export async function uploadToProvider(
	file: UploadedFile,
	provider: FileUploadProviderType,
	settings: AISettings,
): Promise<ProviderFileRef> {
	switch (provider) {
		case 'openai': {
			if (!settings.ai_openai_api_key) {
				throw new InvalidPayloadError({ reason: 'OpenAI API key not configured' });
			}

			return uploadToOpenAI(file, settings.ai_openai_api_key);
		}

		case 'anthropic': {
			if (!settings.ai_anthropic_api_key) {
				throw new InvalidPayloadError({ reason: 'Anthropic API key not configured' });
			}

			return uploadToAnthropic(file, settings.ai_anthropic_api_key);
		}

		case 'google': {
			if (!settings.ai_google_api_key) {
				throw new InvalidPayloadError({ reason: 'Google API key not configured' });
			}

			return uploadToGoogle(file, settings.ai_google_api_key);
		}

		default:
			throw new InvalidPayloadError({ reason: `Provider ${provider} does not support file uploads` });
	}
}
