import { InvalidPayloadError } from '@directus/errors';
import { type Accountability, type SchemaOverview } from '@directus/types';
import type { JSONSchema7, Tool } from 'ai';
import { jsonSchema, tool, zodSchema } from 'ai';
import type { MountedToolRegistry } from '../../tools/index.js';
import { ALL_TOOLS, ToolRegistry } from '../../tools/index.js';
import type { RootTool, ToolResult } from '../../tools/types.js';
import type { ChatRequestTool, ToolApprovalMode } from '../models/chat-request.js';

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
	directusTool: RootTool;
	mountedRegistry: MountedToolRegistry;
	toolApprovals?: Record<string, ToolApprovalMode>;
}): Tool {
	return tool({
		description: directusTool.description,
		inputSchema: zodSchema(directusTool.inputSchema),
		needsApproval: (rawArgs) => needsApproval(directusTool, mountedRegistry, rawArgs, toolApprovals),
		execute: async (rawArgs) => {
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

function needsApproval(
	directusTool: RootTool,
	mountedRegistry: MountedToolRegistry,
	rawArgs: unknown,
	toolApprovals: Record<string, ToolApprovalMode> | undefined,
): boolean {
	if (directusTool.name !== 'execute') {
		return false;
	}

	const args = rawArgs as { input?: unknown; name?: unknown };
	const name = typeof args.name === 'string' ? args.name : '';

	// Disabled tools are excluded from the mount allowlist, so the registry reports them
	// read-only here and `execute` fails them with UNKNOWN_TOOL — no approval prompt needed.
	if (mountedRegistry.isCallReadOnly(name, args.input ?? {})) {
		return false;
	}

	return (toolApprovals?.[name] ?? 'ask') !== 'always';
}

function toModelOutput(result: ToolResult | undefined): unknown {
	if (!result || typeof result.data === 'undefined') return null;

	if (result.type !== 'text') return result;

	return {
		data: result.data,
		...(result.url && { url: result.url }),
	};
}
