import { type JSONSchema7 } from 'ai';
import { z } from 'zod';
import { zodJsonSchema7Parser } from '../utils/zod-jsonschema7-parser.js';
import { ProviderAnthropic, ProviderGoogle, ProviderOpenAi, ProviderOpenAiCompatible } from './providers.js';

export const ObjectRequest = z.intersection(
	z.discriminatedUnion('provider', [ProviderOpenAi, ProviderAnthropic, ProviderGoogle, ProviderOpenAiCompatible]),
	z.object({
		prompt: z.string(),
		outputSchema: z.custom<JSONSchema7>(zodJsonSchema7Parser, { message: 'Invalid JSON schema' }),
		maxOutputTokens: z.number().int().min(256).optional(),
	}),
);

export type ObjectRequest = z.infer<typeof ObjectRequest>;
