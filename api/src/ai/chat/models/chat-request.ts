import { type JSONSchema7 } from 'ai';
import { z } from 'zod';
import { parseJsonSchema7 } from '../utils/parse-json-schema-7.js';
import { ProviderAnthropic, ProviderOpenAi } from './providers.js';

export const ChatRequestTool = z.union([
	z.string(),
	z.object({
		name: z.string(),
		description: z.string(),
		inputSchema: z.custom<JSONSchema7>(
			(schema: unknown): schema is JSONSchema7 => {
				try {
					parseJsonSchema7(schema as unknown);
					return true;
				} catch {
					return false;
				}
			},
			{ message: 'Invalid JSON schema' },
		),
	}),
]);

export type ChatRequestTool = z.infer<typeof ChatRequestTool>;

export const ToolApprovalMode = z.enum(['always', 'ask', 'disabled']);
export type ToolApprovalMode = z.infer<typeof ToolApprovalMode>;

export const ChatRequest = z.intersection(
	z.discriminatedUnion('provider', [ProviderOpenAi, ProviderAnthropic]),
	z.object({
		tools: z.array(ChatRequestTool),
		messages: z.array(z.looseObject({})),
		toolApprovals: z.record(z.string(), ToolApprovalMode).optional(),
	}),
);

export type ChatRequest = z.infer<typeof ChatRequest>;
