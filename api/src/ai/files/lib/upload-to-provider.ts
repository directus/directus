import { InvalidPayloadError } from '@directus/errors';
import type { AISettings } from '../../providers/types.js';
import { uploadToAnthropic, uploadToGoogle, uploadToOpenAI } from '../adapters/index.js';
import type { FileUploadProvider, ProviderFileRef, UploadedFile } from '../types.js';

export async function uploadToProvider(
	file: UploadedFile,
	provider: FileUploadProvider,
	settings: AISettings,
): Promise<ProviderFileRef> {
	switch (provider) {
		case 'openai': {
			if (!settings.openaiApiKey) {
				throw new InvalidPayloadError({ reason: 'OpenAI API key not configured' });
			}

			return uploadToOpenAI(file, settings.openaiApiKey);
		}

		case 'anthropic': {
			if (!settings.anthropicApiKey) {
				throw new InvalidPayloadError({ reason: 'Anthropic API key not configured' });
			}

			return uploadToAnthropic(file, settings.anthropicApiKey);
		}

		case 'google': {
			if (!settings.googleApiKey) {
				throw new InvalidPayloadError({ reason: 'Google API key not configured' });
			}

			return uploadToGoogle(file, settings.googleApiKey);
		}

		default:
			throw new InvalidPayloadError({ reason: `Provider ${provider} does not support file uploads` });
	}
}
