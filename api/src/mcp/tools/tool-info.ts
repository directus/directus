import { z } from 'zod';
import { defineTool } from '../define.js';
import prompts from './prompts/index.js';

const ToolInfoInputSchema = z.object({
	tools: z.array(z.enum(['items', 'collections', 'fields', 'files', 'folders', 'assets', 'flows', 'operations', 'relations', 'schema', 'trigger-flow'])).describe('Array of tool names to get detailed documentation for'),
});

export const toolInfo = defineTool<z.infer<typeof ToolInfoInputSchema>>({
	name: 'tool-info',
	description: prompts.toolInfoBrief,
	inputSchema: ToolInfoInputSchema,
	validateSchema: ToolInfoInputSchema,
	annotations: {
		title: 'Get Detailed Tool Documentation',
	},
	async handler({ args }) {
		const documentation: Record<string, string> = {};

		for (const toolName of args.tools) {
			switch (toolName) {
				case 'items':
					documentation[toolName] = prompts.itemsDetailed;
					break;
				case 'collections':
					documentation[toolName] = prompts.collectionsDetailed;
					break;
				case 'fields':
					documentation[toolName] = prompts.fieldsDetailed;
					break;
				case 'files':
					documentation[toolName] = prompts.filesDetailed;
					break;
				case 'folders':
					documentation[toolName] = prompts.foldersDetailed;
					break;
				case 'assets':
					documentation[toolName] = prompts.assetsDetailed;
					break;
				case 'flows':
					documentation[toolName] = prompts.flowsDetailed;
					break;
				case 'operations':
					documentation[toolName] = prompts.operationsDetailed;
					break;
				case 'relations':
					documentation[toolName] = prompts.relationsDetailed;
					break;
				case 'schema':
					documentation[toolName] = prompts.schemaDetailed;
					break;
				case 'trigger-flow':
					documentation[toolName] = prompts.triggerFlowDetailed;
					break;
			}
		}

		return {
			type: 'text',
			data: documentation,
		};
	},
});