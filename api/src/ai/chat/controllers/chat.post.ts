import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { safeValidateUIMessages, type Tool } from 'ai';
import type { RequestHandler } from 'express';
import { fromZodError } from 'zod-validation-error';
import { useLogger } from '../../../logger/index.js';
import { getMCPClientManager, isExternalMCPTool, type MCPServerConfig } from '../../mcp/client/index.js';
import { createUiStream } from '../lib/create-ui-stream.js';
import { ChatRequest } from '../models/chat-request.js';
import { chatRequestToolToAiSdkTool } from '../utils/chat-request-tool-to-ai-sdk-tool.js';
import { getAllExternalMCPToolsAsAiSdkTools } from '../utils/external-mcp-tool-to-ai-sdk-tool.js';
import { fixErrorToolCalls } from '../utils/fix-error-tool-calls.js';

const logger = useLogger();

/**
 * Initialize MCP client manager with server configurations from settings.
 * This is a lazy initialization that happens on first chat request.
 */
async function initializeMCPClientManager(mcpExternalServers: MCPServerConfig[]): Promise<void> {
	const clientManager = getMCPClientManager();

	// Check if we need to re-initialize (servers changed)
	const currentServers = clientManager.getServers();

	const serversChanged =
		currentServers.length !== mcpExternalServers.length ||
		mcpExternalServers.some((newServer) => {
			const existing = currentServers.find((s) => s.id === newServer.id);
			return !existing || existing.url !== newServer.url || existing.enabled !== newServer.enabled;
		});

	if (!clientManager.initialized || serversChanged) {
		// Disconnect existing connections if re-initializing
		if (clientManager.initialized) {
			await clientManager.disconnectAll();
		}

		// Register new servers
		clientManager.registerServers(mcpExternalServers);

		// Connect to all enabled servers
		await clientManager.connectAll();
	}
}

export const aiChatPostHandler: RequestHandler = async (req, res, _next) => {
	if (!req.accountability?.app) {
		throw new ForbiddenError();
	}

	const parseResult = ChatRequest.safeParse(req.body);

	if (!parseResult.success) {
		throw new InvalidPayloadError({ reason: fromZodError(parseResult.error).message });
	}

	const { provider, model, messages: rawMessages, tools: requestedTools, toolApprovals } = parseResult.data;

	if (rawMessages.length === 0) {
		throw new InvalidPayloadError({ reason: `"messages" must not be empty` });
	}

	// Initialize external MCP servers if configured
	const mcpExternalServers: MCPServerConfig[] = res.locals['ai']?.mcpExternalServers ?? [];

	if (mcpExternalServers.length > 0) {
		try {
			await initializeMCPClientManager(mcpExternalServers);
		} catch (error) {
			logger.warn(`Failed to initialize external MCP servers: ${error}`);
			// Continue without external tools - don't fail the entire chat request
		}
	}

	const clientManager = getMCPClientManager();

	// Build tools map from requested tools
	const tools = requestedTools.reduce<{ [x: string]: Tool<unknown, unknown> }>((acc, t) => {
		const name = typeof t === 'string' ? t : t.name;

		// Skip external MCP tools in this loop - they'll be handled separately
		if (isExternalMCPTool(name)) {
			return acc;
		}

		const aiTool = chatRequestToolToAiSdkTool({
			chatRequestTool: t,
			accountability: req.accountability!,
			schema: req.schema,
			...(toolApprovals && { toolApprovals }),
		}) as Tool<unknown, unknown>;

		acc[name] = aiTool;

		return acc;
	}, {});

	// Add external MCP tools if any servers are connected
	if (clientManager.initialized) {
		const externalTools = getAllExternalMCPToolsAsAiSdkTools(clientManager, toolApprovals);

		logger.debug(`External MCP tools available: ${Object.keys(externalTools).join(', ')}`);

		// Merge external tools, allowing requested tools to filter which external tools are included
		for (const requestedTool of requestedTools) {
			const toolName = typeof requestedTool === 'string' ? requestedTool : requestedTool.name;

			if (isExternalMCPTool(toolName) && externalTools[toolName]) {
				tools[toolName] = externalTools[toolName]!;
			}
		}

		// If no specific external tools were requested, include all available external tools
		const hasRequestedExternalTools = requestedTools.some((t) => isExternalMCPTool(typeof t === 'string' ? t : t.name));

		if (!hasRequestedExternalTools) {
			Object.assign(tools, externalTools);
		}

		logger.debug(`Final tools available: ${Object.keys(tools).join(', ')}`);
	} else {
		logger.debug('MCP client manager not initialized, no external tools available');
	}

	const fixedMessages = fixErrorToolCalls(rawMessages);
	const validationResult = await safeValidateUIMessages({ messages: fixedMessages });

	if (validationResult.success === false) {
		throw new InvalidPayloadError({ reason: validationResult.error.message });
	}

	const stream = createUiStream(validationResult.data, {
		provider,
		model,
		tools: tools,
		apiKeys: res.locals['ai'].apiKeys,
		systemPrompt: res.locals['ai'].systemPrompt,
		onUsage: (usage) => {
			res.write(`data: ${JSON.stringify({ type: 'data-usage', data: usage })}\n\n`);
		},
	});

	stream.pipeUIMessageStreamToResponse(res);
};
