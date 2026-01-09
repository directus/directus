import { z } from 'zod';

export const ProviderOpenAi = z.object({
	provider: z.literal('openai'),
	model: z.union([z.literal('gpt-5'), z.literal('gpt-5-nano'), z.literal('gpt-5-mini'), z.literal('gpt-5-pro')]),
});

export const ProviderAnthropic = z.object({
	provider: z.literal('anthropic'),
	model: z.union([z.literal('claude-sonnet-4-5'), z.literal('claude-haiku-4-5'), z.literal('claude-opus-4-1')]),
});
