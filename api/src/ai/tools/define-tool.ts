import type { ToolConfig } from './types.js';

export function defineTool<Args>(tool: ToolConfig<Args>): ToolConfig<Args> {
	return tool;
}
