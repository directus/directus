import { InvalidPayloadError } from '@directus/errors';
import { type Accountability, type SchemaOverview } from '@directus/types';
import type { JSONSchema7, Tool } from 'ai';
import { jsonSchema, tool, zodSchema } from 'ai';
import type { MountedToolRegistry } from '../../tools/index.js';
import { ALL_TOOLS, ToolRegistry } from '../../tools/index.js';
import type { ToolConfig, ToolResult } from '../../tools/types.js';
import type { ChatRequestTool, ToolApprovalMode } from '../models/chat-request.js';

const PINNED_ROOT_TOOL_NAMES = new Set(['search', 'execute', 'schema']);

export const chatRequestToolsToAiSdkTools = ({
	chatRequestTools,
	accountability,
	schema,
	systemPrompt,
	toolApprovals,
}: {
	chatRequestTools: ChatRequestTool[];
	accountability: Accountability;
	schema: SchemaOverview;
	systemPrompt?: string | null;
	toolApprovals?: Record<string, ToolApprovalMode>;
}): Record<string, Tool> => {
	const requestedToolNames = chatRequestTools.flatMap((chatRequestTool) => {
		if (typeof chatRequestTool !== 'string') return [];
		if (isToolDisabled(chatRequestTool, toolApprovals)) return [];

		return [chatRequestTool];
	});

	const mountedRegistry = new ToolRegistry(ALL_TOOLS).mount({
		accountability,
		schema,
		systemPrompt,
		toolNames: requestedToolNames,
		isToolCallApproved: () => true,
	});

	const tools = mountedRegistry.getRootTools().reduce<Record<string, Tool>>((acc, directusTool) => {
		if (!isPinnedRootTool(directusTool.name) && isToolDisabled(directusTool.name, toolApprovals)) return acc;

		acc[directusTool.name] = directusToolToAiSdkTool({
			directusTool,
			mountedRegistry,
			...(toolApprovals && { toolApprovals }),
		});

		return acc;
	}, {});

	for (const chatRequestTool of chatRequestTools) {
		if (typeof chatRequestTool === 'string') continue;
		if (isToolDisabled(chatRequestTool.name, toolApprovals)) continue;

		if (tools[chatRequestTool.name]) {
			throw new InvalidPayloadError({ reason: `Tool by name "${chatRequestTool.name}" already exists` });
		}

		tools[chatRequestTool.name] = clientToolToAiSdkTool(chatRequestTool);
	}

	return tools;
};

function directusToolToAiSdkTool({
	directusTool,
	mountedRegistry,
	toolApprovals,
}: {
	directusTool: ToolConfig<any>;
	mountedRegistry: MountedToolRegistry;
	toolApprovals?: Record<string, ToolApprovalMode>;
}): Tool {
	return tool({
		description: directusTool.description,
		inputSchema: zodSchema(directusTool.inputSchema),
		needsApproval: (rawArgs) => needsApproval(directusTool, mountedRegistry, rawArgs, toolApprovals),
		execute: async (rawArgs) => {
			const disabledToolName = getDisabledToolName(directusTool.name, rawArgs, toolApprovals);

			if (disabledToolName) {
				return {
					error: {
						code: 'UNKNOWN_TOOL',
						message: `"${disabledToolName}" doesn't exist in the toolset`,
						recoverable: true,
					},
				};
			}

			const result = await mountedRegistry.executeRoot(directusTool.name, rawArgs);

			if (!result.ok) {
				return {
					error: result.error,
				};
			}

			return toModelOutput(result.result);
		},
	});
}

function clientToolToAiSdkTool(chatRequestTool: Exclude<ChatRequestTool, string>): Tool {
	return tool({
		description: chatRequestTool.description,
		inputSchema: jsonSchema(toToolInputSchema(chatRequestTool.inputSchema)),
	});
}

function toToolInputSchema(inputSchema: JSONSchema7): JSONSchema7 {
	if (inputSchema.type === 'object') return inputSchema;

	if (inputSchema.type !== undefined || isObjectShapedSchema(inputSchema) === false) {
		throw new InvalidPayloadError({ reason: 'Tool input schema must be an object schema' });
	}

	return {
		...inputSchema,
		type: 'object',
	};
}

function isObjectShapedSchema(inputSchema: JSONSchema7): boolean {
	return [
		'properties',
		'required',
		'additionalProperties',
		'patternProperties',
		'propertyNames',
		'minProperties',
		'maxProperties',
	].some((key) => key in inputSchema);
}

function isToolDisabled(name: string, toolApprovals: Record<string, ToolApprovalMode> | undefined): boolean {
	return toolApprovals?.[name] === 'disabled';
}

function getDisabledToolName(
	name: string,
	rawArgs: unknown,
	toolApprovals: Record<string, ToolApprovalMode> | undefined,
): string | undefined {
	if (!isPinnedRootTool(name) && isToolDisabled(name, toolApprovals)) return name;
	if (name !== 'execute') return;

	const args = rawArgs as { name?: unknown };
	const targetName = typeof args.name === 'string' ? args.name : '';

	return !isPinnedRootTool(targetName) && isToolDisabled(targetName, toolApprovals) ? targetName : undefined;
}

function isPinnedRootTool(name: string): boolean {
	return PINNED_ROOT_TOOL_NAMES.has(name);
}

function needsApproval(
	directusTool: ToolConfig<any>,
	mountedRegistry: MountedToolRegistry,
	rawArgs: unknown,
	toolApprovals: Record<string, ToolApprovalMode> | undefined,
): boolean {
	if (directusTool.name !== 'execute') {
		return false;
	}

	if (getDisabledToolName(directusTool.name, rawArgs, toolApprovals)) {
		return false;
	}

	const args = rawArgs as { input?: unknown; name?: unknown };
	const name = typeof args.name === 'string' ? args.name : '';
	const input = args.input ?? {};

	if (mountedRegistry.isCallReadOnly(name, input)) {
		return false;
	}

	return (toolApprovals?.[name] ?? 'ask') !== 'always';
}

export function toModelOutput(result: ToolResult | undefined): unknown {
	if (!result || typeof result.data === 'undefined') return null;

	if (result.type !== 'text') return result;

	return {
		data: result.data,
		...(result.url && { url: result.url }),
	};
}
