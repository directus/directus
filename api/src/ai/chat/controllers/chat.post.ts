import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { safeValidateUIMessages, type Tool } from 'ai';
import type { RequestHandler } from 'express';
import { fromZodError } from 'zod-validation-error';
import { createUiStream } from '../lib/create-ui-stream.js';
import { ChatRequest } from '../models/chat-request.js';
import { chatRequestToolToAiSdkTool } from '../utils/chat-request-tool-to-ai-sdk-tool.js';
import { fixErrorToolCalls } from '../utils/fix-error-tool-calls.js';

export const aiChatPostHandler: RequestHandler = async (req, res) => {
	if (!req.accountability?.app) {
		throw new ForbiddenError();
	}

	const parseResult = ChatRequest.safeParse(req.body);

	if (!parseResult.success) {
		throw new InvalidPayloadError({ reason: fromZodError(parseResult.error).message });
	}

	const { provider, model, messages: rawMessages, tools: requestedTools } = parseResult.data;

	if (rawMessages.length === 0) {
		throw new InvalidPayloadError({ reason: `"messages" must not be empty` });
	}

	const tools = requestedTools.reduce<{ [x: string]: Tool<unknown, unknown> }>((acc, t) => {
		const name = typeof t === 'string' ? t : t.name;
		const tool = chatRequestToolToAiSdkTool(t, req.accountability!, req.schema) as Tool<unknown, unknown>;
		acc[name] = tool;
		return acc;
	}, {});

	const fixedMessages = fixErrorToolCalls(rawMessages);
	const validationResult = await safeValidateUIMessages({ messages: fixedMessages });

	if (validationResult.success === false) {
		throw new InvalidPayloadError({ reason: validationResult.error.message });
	}

	const stream = createUiStream(validationResult.data, {
		provider,
		model,
		tools: tools,
		apiKeys: res.locals['ai'].apiKeys,
		systemPrompt: res.locals['ai'].systemPrompt,
		onUsage: (usage) => {
			res.write(`data: ${JSON.stringify({ type: 'data-usage', data: usage })}\n\n`);
		},
	});

	stream.pipeUIMessageStreamToResponse(res);
};
