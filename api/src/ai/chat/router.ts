import asyncHandler from '@/utils/async-handler.js';
import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { convertToModelMessages, safeValidateUIMessages } from 'ai';
import { Router } from 'express';
import { z } from 'zod';
import { createUiStream } from './create-ui-stream.js';
import { loadSettings } from './middleware/load-settings.js';
import { respond } from '@/middleware/respond.js';

export const aiChatRouter = Router();

const ChatInput = z.intersection(
	z.discriminatedUnion('provider', [
		z.object({
			provider: z.literal('openai'),
			model: z.union([z.literal('gpt-5')]),
		}),
		z.object({
			provider: z.literal('anthropic'),
			model: z.union([z.literal('claude-sonnet-4-5')]),
		}),
	]),
	z.object({
		messages: z.array(z.looseObject({})),
	}),
);

aiChatRouter.post(
	'/',
	loadSettings,
	asyncHandler(async (req, res) => {
		if (!req.accountability) {
			throw new ForbiddenError(); // TODO should this be a policy flag?
		}

		const result = ChatInput.safeParse(req.body);

		if (!result.success) {
			throw new InvalidPayloadError({ reason: result.error.message });
		}

		const { provider, model, messages: rawMessages } = result.data;

		if (rawMessages.length === 0) {
			throw new InvalidPayloadError({ reason: `"messages" must not be empty` });
		}

		const validationResult = await safeValidateUIMessages({ messages: rawMessages });

		if (validationResult.success === false) {
			throw new InvalidPayloadError({ reason: validationResult.error.message });
		}

		const stream = createUiStream(provider, model, validationResult.data, res.locals['ai'].apiKeys);
		stream.pipeUIMessageStreamToResponse(res);
	}),
);
