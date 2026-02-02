import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { generateText, jsonSchema } from 'ai';
import type { RequestHandler } from 'express';
import { fromZodError } from 'zod-validation-error';
import { ObjectRequest } from '../models/object-request.js';
import { getVercelModelProvider } from '../utils/get-vercel-model-provider.js';

export const aiObjectPostHandler: RequestHandler = async (req, res, next) => {
	if (!req.accountability?.app) {
		throw new ForbiddenError();
	}

	const parseResult = ObjectRequest.safeParse(req.body);

	if (!parseResult.success) {
		throw new InvalidPayloadError({ reason: fromZodError(parseResult.error).message });
	}

	const { provider, model, prompt, outputSchema, maxOutputTokens } = parseResult.data;

	const modelProvider = getVercelModelProvider(provider, res.locals['ai'].apiKeys);

	const { toolCalls } = await generateText({
		model: modelProvider(model),
		prompt,
		tools: {
			respond: {
				type: 'function',
				description: 'Your response',
				inputSchema: jsonSchema(outputSchema),
			},
		},
		toolChoice: 'required',
		...(typeof maxOutputTokens === 'number' ? { maxOutputTokens } : {}),
	});

	res.locals['payload'] = toolCalls?.[0]?.input;

	return next();
};
