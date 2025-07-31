import { defineTool } from '../tool.js';
import { z } from 'zod';

export const system = defineTool({
	name: 'system-prompt',
	description: 'IMPORTANT! Call this tool first. It will retrieve important information about your role.',
	inputSchema: z.object({}),
	async handler() {
		return {
			type: 'text',
			data: 'MCP SYSTEM PROMPT',
		};
	},
});
