import { z } from 'zod';
import type { ProviderType } from '../../providers/types.js';

export const ProviderTypeSchema = z.enum(['openai', 'anthropic', 'google', 'openai-compatible']) satisfies z.ZodType<ProviderType>;

export const ProviderOpenAi = z.object({
	provider: z.literal('openai'),
	model: z.string(),
});

export const ProviderAnthropic = z.object({
	provider: z.literal('anthropic'),
	model: z.string(),
});

export const ProviderGoogle = z.object({
	provider: z.literal('google'),
	model: z.string(),
});

export const ProviderOpenAiCompatible = z.object({
	provider: z.literal('openai-compatible'),
	model: z.string(),
});
