import { z } from 'zod';
import { defineTool } from '../tool.js';

export const system = defineTool('system-prompt', {
	description: 'IMPORTANT! Call this tool first. It will retrieve important information about your role.',
	inputSchema: z.object({}),
	async handler() {
		return {
			data: 'MCP SYSTEM PROMPT',
		};
	},
});
