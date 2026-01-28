import { type JSONSchema7 } from 'ai';
import { z } from 'zod';
import { parseJsonSchema7 } from '../utils/parse-json-schema-7.js';
import { ProviderAnthropic, ProviderGoogle, ProviderOpenAi, ProviderOpenAiCompatible } from './providers.js';

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

const ItemContextData = z.object({
	collection: z.string(),
	id: z.union([z.string(), z.number()]),
});

const VisualElementContextData = z.object({
	key: z.string(),
	collection: z.string(),
	item: z.union([z.string(), z.number()]),
	fields: z.array(z.string()).optional(),
	rect: z
		.object({
			top: z.number(),
			left: z.number(),
			width: z.number(),
			height: z.number(),
		})
		.optional(),
});

const PromptContextData = z.object({
	text: z.string(),
	prompt: z.record(z.string(), z.unknown()),
	values: z.record(z.string(), z.string()),
});

export const ContextAttachment = z.discriminatedUnion('type', [
	z.object({
		type: z.literal('item'),
		display: z.string(),
		data: ItemContextData,
		snapshot: z.record(z.string(), z.unknown()),
	}),
	z.object({
		type: z.literal('visual-element'),
		display: z.string(),
		data: VisualElementContextData,
		snapshot: z.record(z.string(), z.unknown()),
	}),
	z.object({
		type: z.literal('prompt'),
		display: z.string(),
		data: PromptContextData,
		snapshot: z.record(z.string(), z.unknown()),
	}),
]);

export type ContextAttachment = z.infer<typeof ContextAttachment>;

export const PageContext = z.object({
	path: z.string(),
	collection: z.string().optional(),
	item: z.union([z.string(), z.number()]).optional(),
	module: z.string().optional(),
});

export type PageContext = z.infer<typeof PageContext>;

export const ChatContext = z.object({
	attachments: z.array(ContextAttachment).optional(),
	page: PageContext.optional(),
});

export type ChatContext = z.infer<typeof ChatContext>;

export const ChatRequest = z.intersection(
	z.discriminatedUnion('provider', [ProviderOpenAi, ProviderAnthropic, ProviderGoogle, ProviderOpenAiCompatible]),
	z.object({
		tools: z.array(ChatRequestTool),
		messages: z.array(z.looseObject({})),
		toolApprovals: z.record(z.string(), ToolApprovalMode).optional(),
		context: ChatContext.optional(),
	}),
);

export type ChatRequest = z.infer<typeof ChatRequest>;
