import { ALL_TOOLS } from '@/ai/tools/index.js';
import { InvalidPayloadError } from '@directus/errors';
import { type Accountability, type SchemaOverview } from '@directus/types';
import type { Tool } from 'ai';
import { jsonSchema, tool } from 'ai';
import { fromZodError } from 'zod-validation-error';
import type { ChatRequestTool } from '../models/chat-request.js';

export const chatRequestToolToAiSdkTool = ({
	chatRequestTool,
	accountability,
	schema,
	toolApprovals,
}: {
	chatRequestTool: ChatRequestTool;
	accountability: Accountability;
	schema: SchemaOverview;
	toolApprovals?: Record<string, 'always' | 'ask' | 'disabled'>;
}): Tool => {
	if (typeof chatRequestTool === 'string') {
		const directusTool = ALL_TOOLS.find(({ name }) => name === chatRequestTool);

		if (!directusTool) {
			throw new InvalidPayloadError({ reason: `Tool by name "${chatRequestTool}" does not exist` });
		}

		// Determine if tool needs approval based on client settings
		// Default to 'ask' (needs approval) if not specified
		const approvalMode = toolApprovals?.[chatRequestTool] ?? 'ask';
		const needsApproval = approvalMode !== 'always';

		return tool({
			name: directusTool.name,
			description: directusTool.description,
			inputSchema: directusTool.inputSchema,
			needsApproval,
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

	// Local/client-side tool (schema only, executed on client)
	return tool({
		name: chatRequestTool.name,
		description: chatRequestTool.description,
		inputSchema: jsonSchema(chatRequestTool.inputSchema),
	});
};
