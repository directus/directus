import { SettingsService } from '@/services/settings.js';
import { getSchema } from '@/utils/get-schema.js';
import type { RequestHandler } from 'express';

export const loadSettings: RequestHandler = async (_req, res, next) => {
	const service = new SettingsService({
		schema: await getSchema(),
	});

	const { ai_openai_api_key, ai_anthropic_api_key, ai_system_prompt } = await service.readSingleton({
		fields: ['ai_openai_api_key', 'ai_anthropic_api_key', 'ai_system_prompt'],
	});

	res.locals['ai'] = {
		apiKeys: {
			openai: ai_openai_api_key,
			anthropic: ai_anthropic_api_key,
		},
		systemPrompt: ai_system_prompt,
	};

	return next();
};
