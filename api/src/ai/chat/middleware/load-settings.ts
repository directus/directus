import type { RequestHandler } from 'express';
import { SettingsService } from '../../../services/settings.js';
import { getSchema } from '../../../utils/get-schema.js';
import type { AISettings } from '../../providers/types.js';

export const loadSettings: RequestHandler = async (_req, res, next) => {
	const service = new SettingsService({
		schema: await getSchema(),
	});

	const settings = await service.readSingleton({
		fields: [
			'ai_openai_api_key',
			'ai_anthropic_api_key',
			'ai_google_api_key',
			'ai_openai_compatible_api_key',
			'ai_openai_compatible_base_url',
			'ai_openai_compatible_name',
			'ai_openai_compatible_models',
			'ai_openai_compatible_headers',
			'ai_openai_allowed_models',
			'ai_anthropic_allowed_models',
			'ai_google_allowed_models',
			'ai_system_prompt',
		],
	});

	const aiSettings: AISettings = {
		openaiApiKey: settings['ai_openai_api_key'] ?? null,
		anthropicApiKey: settings['ai_anthropic_api_key'] ?? null,
		googleApiKey: settings['ai_google_api_key'] ?? null,
		openaiCompatibleApiKey: settings['ai_openai_compatible_api_key'] ?? null,
		openaiCompatibleBaseUrl: settings['ai_openai_compatible_base_url'] ?? null,
		openaiCompatibleName: settings['ai_openai_compatible_name'] ?? null,
		openaiCompatibleModels: settings['ai_openai_compatible_models'] ?? null,
		openaiCompatibleHeaders: settings['ai_openai_compatible_headers'] ?? null,
		openaiAllowedModels: settings['ai_openai_allowed_models'] ?? null,
		anthropicAllowedModels: settings['ai_anthropic_allowed_models'] ?? null,
		googleAllowedModels: settings['ai_google_allowed_models'] ?? null,
		systemPrompt: settings['ai_system_prompt'] ?? null,
	};

	res.locals['ai'] = {
		settings: aiSettings,
		systemPrompt: settings['ai_system_prompt'],
	};

	return next();
};
