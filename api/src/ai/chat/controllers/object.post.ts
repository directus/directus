import type { StandardProviderType } from '@directus/ai';
import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { jsonSchema, streamObject } from 'ai';
import type { RequestHandler } from 'express';
import { fromZodError } from 'zod-validation-error';
import { type AISettings, resolveLanguageModel } from '../../providers/index.js';
import { getAITelemetryConfig } from '../../telemetry/index.js';
import { ObjectRequest } from '../models/object-request.js';
import { addAdditionalPropertiesToJsonSchema } from '../utils/add-additional-properties-to-json-schema.js';

export const aiObjectPostHandler: RequestHandler = async (req, res) => {
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

	const { model: languageModel, providerOptions } = resolveLanguageModel(provider, model, aiSettings);

	const telemetryConfig = getAITelemetryConfig(
		{ provider, model, userId: req.accountability?.user, role: req.accountability?.role },
		'directus-ai-object',
	);

	const result = streamObject({
		model: languageModel,
		prompt,
		schema: jsonSchema(addAdditionalPropertiesToJsonSchema(outputSchema)),
		providerOptions,
		...(typeof maxOutputTokens === 'number' ? { maxOutputTokens } : {}),
		...(telemetryConfig ? { experimental_telemetry: telemetryConfig } : {}),
	});

	result.pipeTextStreamToResponse(res);
};
