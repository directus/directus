import type { StandardProviderType } from '@directus/ai';
import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { safeValidateUIMessages, type Tool } from 'ai';
import type { RequestHandler } from 'express';
import { fromZodError } from 'zod-validation-error';
import { createUiStream } from '../lib/create-ui-stream.js';
import { ChatRequest } from '../models/chat-request.js';
import { chatRequestToolsToAiSdkTools } from '../utils/chat-request-tool-to-ai-sdk-tool.js';
import { fixErrorToolCalls } from '../utils/fix-error-tool-calls.js';

export const aiChatPostHandler: RequestHandler = async (req, res, _next) => {
	if (!req.accountability?.app) {
		throw new ForbiddenError();
	}

	const parseResult = ChatRequest.safeParse(req.body);

	if (!parseResult.success) {
		throw new InvalidPayloadError({ reason: fromZodError(parseResult.error).message });
	}

	const { provider, model, messages: rawMessages, tools: requestedTools, toolApprovals, context } = parseResult.data;

	const aiSettings = res.locals['ai'].settings;

	const allowedModelsMap: Record<StandardProviderType, string[] | null> = {
		openai: aiSettings.openaiAllowedModels,
		anthropic: aiSettings.anthropicAllowedModels,
		google: aiSettings.googleAllowedModels,
	};

	// For standard providers: null/empty = no models allowed, must be in list
	// openai-compatible skips validation entirely
	if (provider !== 'openai-compatible') {
		const allowedModels = allowedModelsMap[provider];

		if (!allowedModels || allowedModels.length === 0 || !allowedModels.includes(model)) {
			throw new ForbiddenError({ reason: 'Model not allowed for this provider' });
		}
	}

	if (rawMessages.length === 0) {
		throw new InvalidPayloadError({ reason: `"messages" must not be empty` });
	}

	const fixedMessages = fixErrorToolCalls(rawMessages);

	const tools = chatRequestToolsToAiSdkTools({
		chatRequestTools: requestedTools,
		accountability: req.accountability!,
		schema: req.schema,
		systemPrompt: res.locals['ai'].systemPrompt,
		...(toolApprovals && { toolApprovals }),
	}) as { [x: string]: Tool<unknown, unknown> };

	const validationResult = await safeValidateUIMessages({ messages: fixedMessages });

	if (validationResult.success === false) {
		throw new InvalidPayloadError({ reason: validationResult.error.message });
	}

	const stream = await createUiStream(validationResult.data, {
		provider,
		model,
		tools,
		aiSettings,
		userId: req.accountability?.user,
		role: req.accountability?.role,
		systemPrompt: res.locals['ai'].systemPrompt,
		...(context && { context }),
		onUsage: (usage) => {
			res.write(`data: ${JSON.stringify({ type: 'data-usage', data: usage })}\n\n`);
		},
	});

	stream.pipeUIMessageStreamToResponse(res);
};
