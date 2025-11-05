import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { safeValidateUIMessages, type Tool } from 'ai';
import type { RequestHandler } from 'express';
import { fromZodError } from 'zod-validation-error';
import { createUiStream } from '../lib/create-ui-stream.js';
import { ChatRequest } from '../models/chat-request.js';
import { chatRequestToolToAiSdkTool } from '../utils/chat-request-tool-to-ai-sdk-tool.js';

export const aiChatPostHandler: RequestHandler = async (req, res) => {
	if (!req.accountability) {
		throw new ForbiddenError(); // TODO should this be a policy flag?
	}

	const result = ChatRequest.safeParse(req.body);

	if (!result.success) {
		throw new InvalidPayloadError({ reason: fromZodError(result.error).message });
	}

	const { provider, model, messages: rawMessages, tools } = result.data;

	if (rawMessages.length === 0) {
		throw new InvalidPayloadError({ reason: `"messages" must not be empty` });
	}

	const aiSdkTools = tools.reduce<{ [x: string]: Tool<unknown, unknown> }>((acc, t) => {
		const name = typeof t === 'string' ? t : t.name;
		const tool = chatRequestToolToAiSdkTool(t, req.accountability!, req.schema) as Tool<unknown, unknown>;
		acc[name] = tool;
		return acc;
	}, {});

	const validationResult = await safeValidateUIMessages({ messages: rawMessages, tools: aiSdkTools });

	if (validationResult.success === false) {
		throw new InvalidPayloadError({ reason: validationResult.error.message });
	}

	const stream = createUiStream(provider, model, validationResult.data, aiSdkTools, res.locals['ai'].apiKeys);
	stream.pipeUIMessageStreamToResponse(res);
};
