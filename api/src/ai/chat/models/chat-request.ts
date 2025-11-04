import { type JSONSchema7 } from 'ai';
import { z } from 'zod';

export const ChatRequestTool = z.union([
	z.string(),
	z.object({
		name: z.string(),
		description: z.string(),
		inputSchema: z.custom<JSONSchema7>((_schema) => {
			// TODO validate that `schema` is a valid JSON Schema draft-07 structure
			return true;
		}, { message: 'Invalid JSON schema' }),
	}),
]);

export type ChatRequestTool = z.infer<typeof ChatRequestTool>;

export const ChatRequest = z.intersection(
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
		tools: z.array(ChatRequestTool),
		messages: z.array(z.looseObject({})),
	}),
);

export type ChatRequest = z.infer<typeof ChatRequest>;
