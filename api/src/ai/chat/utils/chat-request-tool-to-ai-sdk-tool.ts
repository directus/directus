import { ALL_TOOLS } from '@/ai/tools/index.js';
import { InvalidPayloadError } from '@directus/errors';
import { type Accountability, type SchemaOverview } from '@directus/types';
import type { Tool } from 'ai';
import { jsonSchema, tool } from 'ai';
import { fromZodError } from 'zod-validation-error';
import type { ChatRequestTool } from '../models/chat-request.js';

export const chatRequestToolToAiSdkTool = (
	chatRequestTool: ChatRequestTool,
	accountability: Accountability,
	schema: SchemaOverview,
): Tool => {
	if (typeof chatRequestTool === 'string') {
		const directusTool = ALL_TOOLS.find(({ name }) => name === chatRequestTool);

		if (!directusTool) {
			throw new Error(`Tool with name "${chatRequestTool}" does not exist`);
		}

		return tool({
			name: directusTool.name,
			description: directusTool.description,
			inputSchema: directusTool.inputSchema,
			execute: async (rawArgs) => {
				const { error, data: args } = directusTool.validateSchema?.safeParse(rawArgs) ?? {
					data: rawArgs,
				};

				if (error) {
					throw new InvalidPayloadError({ reason: fromZodError(error).message });
				}

				return directusTool.handler({ args, accountability, schema });
			},
		});
	}

	return tool({
		name: chatRequestTool.name,
		description: chatRequestTool.description,
		inputSchema: jsonSchema(chatRequestTool.inputSchema),
	});
};
