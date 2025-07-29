import { defineTool } from '../tool.js';

export const system = defineTool({
	name: 'system-prompt',
	description: 'IMPORTANT! Call this tool first. It will retrieve important information about your role.',
	async handler() {
		return {
			type: 'text',
			data: 'MCP SYSTEM PROMPT',
		};
	},
});
