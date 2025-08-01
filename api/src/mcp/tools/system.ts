import { z } from 'zod';
import { defineTool } from '../tool.js';
import prompts from './prompts/index.js';

export const system = defineTool({
	name: 'system-prompt',
	description: prompts.system,
	inputSchema: z.object({}),
	async handler() {
		return {
			type: 'text',
			data: 'MCP SYSTEM PROMPT',
		};
	},
});
