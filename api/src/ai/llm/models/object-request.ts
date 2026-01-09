import { type JSONSchema7 } from 'ai';
import { z } from 'zod';
import { zodJsonSchema7Parser } from '../utils/zod-jsonschema7-parser.js';
import { ProviderAnthropic, ProviderOpenAi } from './providers.js';

export const ObjectRequest = z.intersection(
	z.discriminatedUnion('provider', [ProviderOpenAi, ProviderAnthropic]),
	z.object({
		prompt: z.string(),
		outputSchema: z.custom<JSONSchema7>(zodJsonSchema7Parser, { message: 'Invalid JSON schema' }),
	}),
);
