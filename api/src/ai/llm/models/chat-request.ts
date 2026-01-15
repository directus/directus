import { type JSONSchema7 } from 'ai';
import { z } from 'zod';
import { zodJsonSchema7Parser } from '../utils/zod-jsonschema7-parser.js';
import { ProviderAnthropic, ProviderOpenAi } from './providers.js';

export const ChatRequestTool = z.union([
	z.string(),
	z.object({
		name: z.string(),
		description: z.string(),
		inputSchema: z.custom<JSONSchema7>(zodJsonSchema7Parser, { message: 'Invalid JSON schema' }),
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
