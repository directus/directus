import type { StandardProviderType } from '@directus/ai';
import { ForbiddenError, InvalidPayloadError, ServiceUnavailableError } from '@directus/errors';
import { generateText, jsonSchema, Output } from 'ai';
import type { RequestHandler } from 'express';
import { fromZodError } from 'zod-validation-error';
import {
	type AISettings,
	buildProviderConfigs,
	createAIProviderRegistry,
	getProviderOptions,
} from '../../providers/index.js';
import { ObjectRequest } from '../models/object-request.js';
import { addAdditionalPropertiesToJsonSchema } from '../utils/add-additional-properties-to-json-schema.js';

export const aiObjectPostHandler: RequestHandler = async (req, res, next) => {
	if (!req.accountability?.app) {
		throw new ForbiddenError();
	}

	const parseResult = ObjectRequest.safeParse(req.body);

	if (!parseResult.success) {
		throw new InvalidPayloadError({ reason: fromZodError(parseResult.error).message });
	}

	const { provider, model, prompt, outputSchema, maxOutputTokens } = parseResult.data;

	const aiSettings: AISettings = res.locals['ai'].settings;

	const allowedModelsMap: Record<StandardProviderType, string[] | null> = {
		openai: aiSettings.openaiAllowedModels,
		anthropic: aiSettings.anthropicAllowedModels,
		google: aiSettings.googleAllowedModels,
	};

	if (provider !== 'openai-compatible') {
		const allowedModels = allowedModelsMap[provider];

		if (!allowedModels || allowedModels.length === 0 || !allowedModels.includes(model)) {
			throw new ForbiddenError({ reason: 'Model not allowed for this provider' });
		}
	}

	const configs = buildProviderConfigs(aiSettings);
	const providerConfig = configs.find((c) => c.type === provider);

	if (!providerConfig) {
		throw new ServiceUnavailableError({ service: provider, reason: 'No API key configured for LLM provider' });
	}

	const registry = createAIProviderRegistry(configs, aiSettings);
	const providerOptions = getProviderOptions(provider, model, aiSettings);

	const result = await generateText({
		model: registry.languageModel(`${provider}:${model}`),
		prompt,
		output: Output.object({ schema: jsonSchema(addAdditionalPropertiesToJsonSchema(outputSchema)) }),
		providerOptions,
		...(typeof maxOutputTokens === 'number' ? { maxOutputTokens } : {}),
	});

	if (result.output == null) {
		throw new ServiceUnavailableError({ service: 'ai', reason: 'Model did not return structured output' });
	}

	res.locals['payload'] = { data: result.output };

	return next();
};
