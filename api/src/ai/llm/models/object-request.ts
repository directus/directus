import { type JSONSchema7 } from 'ai';
import { z } from 'zod';
import { MIN_OBJECT_OUTPUT_TOKENS } from '../constants/object-output-tokens.js';
import { zodJsonSchema7Parser } from '../utils/zod-jsonschema7-parser.js';
import { ProviderAnthropic, ProviderOpenAi } from './providers.js';

export const ObjectRequest = z.intersection(
	z.discriminatedUnion('provider', [ProviderOpenAi, ProviderAnthropic]),
	z.object({
		prompt: z.string(),
		outputSchema: z.custom<JSONSchema7>(zodJsonSchema7Parser, { message: 'Invalid JSON schema' }),
		maxOutputTokens: z.number().int().min(MIN_OBJECT_OUTPUT_TOKENS).optional(),
	}),
);
