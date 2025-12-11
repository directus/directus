import { ForbiddenError } from '@directus/errors';
import type { RequestHandler } from 'express';
import { useLogger } from '../../../logger/index.js';
import { buildMCPToolName, getMCPClientManager, type MCPServerConfig } from '../../mcp/client/index.js';

const logger = useLogger();

export interface ExternalMCPToolInfo {
	/** Full tool name in format mcp:<server-id>:<tool-name> */
	name: string;
	/** Tool description */
	description: string;
	/** Server ID this tool belongs to */
	serverId: string;
	/** Server display name */
	serverName: string;
	/** Tool approval mode from server config */
	toolApproval: 'always' | 'ask' | 'disabled';
}

/**
 * Initialize MCP client manager with server configurations from settings.
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

/**
 * GET /ai/chat/tools - List all available external MCP tools
 */
export const aiToolsGetHandler: RequestHandler = async (req, res) => {
	if (!req.accountability?.app) {
		throw new ForbiddenError();
	}

	const mcpExternalServers: MCPServerConfig[] = res.locals['ai']?.mcpExternalServers ?? [];
	const externalTools: ExternalMCPToolInfo[] = [];

	if (mcpExternalServers.length > 0) {
		try {
			await initializeMCPClientManager(mcpExternalServers);
		} catch (error) {
			logger.warn(`Failed to initialize external MCP servers: ${error}`);
			// Return empty tools list rather than failing
			return res.json({ data: externalTools });
		}
	}

	const clientManager = getMCPClientManager();

	if (clientManager.initialized) {
		const servers = clientManager.getServers();

		for (const server of servers) {
			if (!server.enabled) continue;

			try {
				const client = clientManager.getClient(server.id);

				if (client && client.isConnected()) {
					const tools = await client.listTools();

					for (const tool of tools) {
						externalTools.push({
							name: buildMCPToolName(server.id, tool.name),
							description: tool.description || '',
							serverId: server.id,
							serverName: server.name,
							toolApproval: server.toolApproval,
						});
					}
				}
			} catch (error) {
				logger.warn(`Failed to get tools from MCP server ${server.id}: ${error}`);
				// Continue with other servers
			}
		}
	}

	return res.json({ data: externalTools });
};
