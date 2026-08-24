import type { ToolConfig } from './types.js';

export function defineTool<Input, Output = unknown>(tool: ToolConfig<Input, Output>): ToolConfig<Input, Output> {
	return tool;
}
