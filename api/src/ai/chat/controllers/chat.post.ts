import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { safeValidateUIMessages } from 'ai';
import type { RequestHandler } from 'express';
import { fromZodError } from 'zod-validation-error';
import type { AISettings } from '../../providers/types.js';
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

	const aiSettings: AISettings = res.locals['ai'].settings;

	if (rawMessages.length === 0) {
		throw new InvalidPayloadError({ reason: `"messages" must not be empty` });
	}

	const fixedMessages = fixErrorToolCalls(rawMessages);

	const tools = chatRequestToolsToAiSdkTools({
		chatRequestTools: requestedTools,
		accountability: req.accountability!,
		schema: req.schema,
		systemPrompt: aiSettings.ai_system_prompt,
		...(toolApprovals && { toolApprovals }),
	});

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
		systemPrompt: aiSettings.ai_system_prompt,
		...(context && { context }),
		onUsage: (usage) => {
			res.write(`data: ${JSON.stringify({ type: 'data-usage', data: usage })}\n\n`);
		},
	});

	stream.pipeUIMessageStreamToResponse(res);
};
