import { useLogger } from '../../../logger/index.js';
import { MCPClient } from './mcp-client.js';
import type { ExternalMCPTool, MCPServerConfig, MCPToolResult } from './types.js';

const logger = useLogger();

/** Prefix for external MCP tool names */
export const MCP_TOOL_PREFIX = 'mcp';

/** Separator used in MCP tool names (must be valid in pattern ^[a-zA-Z0-9_-]{1,128}$) */
const MCP_TOOL_SEPARATOR = '__';

/**
 * Build a full tool name from server ID and tool name
 *
 * @param serverId - The server ID
 * @param toolName - The original tool name
 * @returns The full tool name in format: mcp__<server-id>__<tool-name>
 */
export function buildMCPToolName(serverId: string, toolName: string): string {
	return `${MCP_TOOL_PREFIX}${MCP_TOOL_SEPARATOR}${serverId}${MCP_TOOL_SEPARATOR}${toolName}`;
}

/**
 * Parse a full MCP tool name into its components
 *
 * @param fullName - The full tool name (e.g., mcp__weather-server__get_forecast)
 * @returns The parsed components or null if not a valid MCP tool name
 */
export function parseMCPToolName(fullName: string): { serverId: string; toolName: string } | null {
	// Check the prefix
	const prefix = `${MCP_TOOL_PREFIX}${MCP_TOOL_SEPARATOR}`;

	if (!fullName.startsWith(prefix)) {
		return null;
	}

	// Find the second separator (after the server ID)
	const withoutPrefix = fullName.slice(prefix.length);
	const separatorIndex = withoutPrefix.indexOf(MCP_TOOL_SEPARATOR);

	if (separatorIndex === -1) {
		return null;
	}

	const serverId = withoutPrefix.slice(0, separatorIndex);
	const toolName = withoutPrefix.slice(separatorIndex + MCP_TOOL_SEPARATOR.length);

	if (!serverId || !toolName) {
		return null;
	}

	return {
		serverId,
		toolName,
	};
}

/**
 * Check if a tool name is an external MCP tool
 */
export function isExternalMCPTool(toolName: string): boolean {
	return toolName.startsWith(`${MCP_TOOL_PREFIX}${MCP_TOOL_SEPARATOR}`);
}

/**
 * Manages connections to multiple external MCP servers.
 *
 * This class handles:
 * - Registering and managing MCP server configurations
 * - Establishing and maintaining connections to enabled servers
 * - Aggregating tools from all connected servers
 * - Routing tool calls to the appropriate server
 */
export class MCPClientManager {
	private servers: Map<string, MCPServerConfig> = new Map();
	private clients: Map<string, MCPClient> = new Map();
	private toolsCache: Map<string, ExternalMCPTool[]> = new Map();
	private _initialized = false;

	/**
	 * Check if the manager has been initialized
	 */
	get initialized(): boolean {
		return this._initialized;
	}

	/**
	 * Register an MCP server configuration
	 *
	 * @param config - The server configuration
	 */
	registerServer(config: MCPServerConfig): void {
		this.servers.set(config.id, config);
		// Clear tools cache for this server since config may have changed
		this.toolsCache.delete(config.id);

		logger.debug(`Registered MCP server: ${config.name} (${config.id})`);
	}

	/**
	 * Register multiple MCP server configurations
	 *
	 * @param configs - Array of server configurations
	 */
	registerServers(configs: MCPServerConfig[]): void {
		for (const config of configs) {
			this.registerServer(config);
		}
	}

	/**
	 * Unregister an MCP server
	 *
	 * @param serverId - The server ID to unregister
	 */
	async unregisterServer(serverId: string): Promise<void> {
		const client = this.clients.get(serverId);

		if (client) {
			await client.disconnect();
			this.clients.delete(serverId);
		}

		this.servers.delete(serverId);
		this.toolsCache.delete(serverId);

		logger.debug(`Unregistered MCP server: ${serverId}`);
	}

	/**
	 * Get all registered server configurations
	 */
	getServers(): MCPServerConfig[] {
		return Array.from(this.servers.values());
	}

	/**
	 * Get a specific server configuration
	 */
	getServer(serverId: string): MCPServerConfig | undefined {
		return this.servers.get(serverId);
	}

	/**
	 * Get the client for a specific server
	 */
	getClient(serverId: string): MCPClient | undefined {
		return this.clients.get(serverId);
	}

	/**
	 * Connect to a specific MCP server
	 *
	 * @param serverId - The server ID to connect to
	 */
	async connectServer(serverId: string): Promise<void> {
		const config = this.servers.get(serverId);

		if (!config) {
			throw new Error(`MCP server "${serverId}" is not registered`);
		}

		if (!config.enabled) {
			logger.debug(`Skipping disabled MCP server: ${config.name} (${serverId})`);
			return;
		}

		// Disconnect existing client if any
		const existingClient = this.clients.get(serverId);

		if (existingClient?.isConnected()) {
			await existingClient.disconnect();
		}

		const client = new MCPClient();

		try {
			await client.connect(config.url, config.auth ? { auth: config.auth } : undefined);

			this.clients.set(serverId, client);

			// Pre-fetch and cache tools
			const tools = await client.listTools();

			const externalTools: ExternalMCPTool[] = tools.map((tool) => ({
				fullName: buildMCPToolName(serverId, tool.name),
				originalName: tool.name,
				serverId,
				serverName: config.name,
				description: tool.description ?? '',
				inputSchema: tool.inputSchema,
				toolApproval: config.toolApproval,
			}));

			this.toolsCache.set(serverId, externalTools);

			logger.info(`Connected to MCP server: ${config.name} (${serverId}) - ${tools.length} tools available`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			logger.error(`Failed to connect to MCP server "${config.name}" (${serverId}): ${errorMessage}`);

			// Don't throw - allow other servers to connect
			// Store the client anyway so we can track its error state
			this.clients.set(serverId, client);
		}
	}

	/**
	 * Connect to all enabled MCP servers
	 */
	async connectAll(): Promise<void> {
		const connectionPromises: Promise<void>[] = [];

		for (const [serverId, config] of this.servers) {
			if (config.enabled) {
				connectionPromises.push(this.connectServer(serverId));
			}
		}

		await Promise.allSettled(connectionPromises);
		this._initialized = true;

		const connectedCount = Array.from(this.clients.values()).filter((c) => c.isConnected()).length;
		logger.info(`MCP client manager initialized: ${connectedCount}/${this.servers.size} servers connected`);
	}

	/**
	 * Disconnect from all MCP servers
	 */
	async disconnectAll(): Promise<void> {
		const disconnectPromises: Promise<void>[] = [];

		for (const client of this.clients.values()) {
			disconnectPromises.push(client.disconnect());
		}

		await Promise.allSettled(disconnectPromises);

		this.clients.clear();
		this.toolsCache.clear();
		this._initialized = false;

		logger.info('Disconnected from all MCP servers');
	}

	/**
	 * Get all available tools from all connected servers
	 *
	 * @returns Array of external MCP tools from all connected servers
	 */
	getAllTools(): ExternalMCPTool[] {
		const allTools: ExternalMCPTool[] = [];

		for (const [serverId, config] of this.servers) {
			if (!config.enabled) continue;

			const tools = this.toolsCache.get(serverId);

			if (tools) {
				allTools.push(...tools);
			}
		}

		return allTools;
	}

	/**
	 * Get tools from a specific server
	 *
	 * @param serverId - The server ID
	 * @returns Array of tools from the specified server
	 */
	getServerTools(serverId: string): ExternalMCPTool[] {
		return this.toolsCache.get(serverId) ?? [];
	}

	/**
	 * Find an external tool by its full name
	 *
	 * @param fullName - The full tool name (e.g., mcp:weather-server:get_forecast)
	 * @returns The external tool or undefined if not found
	 */
	findTool(fullName: string): ExternalMCPTool | undefined {
		const parsed = parseMCPToolName(fullName);

		if (!parsed) return undefined;

		const serverTools = this.toolsCache.get(parsed.serverId);

		if (!serverTools) return undefined;

		return serverTools.find((t) => t.originalName === parsed.toolName);
	}

	/**
	 * Call a tool on the appropriate MCP server
	 *
	 * @param fullToolName - The full tool name (e.g., mcp:weather-server:get_forecast)
	 * @param args - Arguments to pass to the tool
	 * @returns The tool result
	 */
	async callTool(fullToolName: string, args: Record<string, unknown>): Promise<MCPToolResult> {
		const parsed = parseMCPToolName(fullToolName);

		if (!parsed) {
			throw new Error(`Invalid MCP tool name: ${fullToolName}`);
		}

		const { serverId, toolName } = parsed;
		const client = this.clients.get(serverId);

		if (!client) {
			throw new Error(`MCP server "${serverId}" is not connected`);
		}

		if (!client.isConnected()) {
			// Try to reconnect
			logger.warn(`MCP server "${serverId}" is disconnected, attempting to reconnect...`);
			await client.reconnect();
		}

		return client.callTool(toolName, args);
	}

	/**
	 * Refresh tools from a specific server
	 *
	 * @param serverId - The server ID to refresh tools for
	 */
	async refreshServerTools(serverId: string): Promise<void> {
		const client = this.clients.get(serverId);
		const config = this.servers.get(serverId);

		if (!client || !config) {
			throw new Error(`MCP server "${serverId}" is not connected`);
		}

		if (!client.isConnected()) {
			await client.reconnect();
		}

		const tools = await client.listTools();

		const externalTools: ExternalMCPTool[] = tools.map((tool) => ({
			fullName: buildMCPToolName(serverId, tool.name),
			originalName: tool.name,
			serverId,
			serverName: config.name,
			description: tool.description ?? '',
			inputSchema: tool.inputSchema,
			toolApproval: config.toolApproval,
		}));

		this.toolsCache.set(serverId, externalTools);

		logger.info(`Refreshed tools for MCP server "${config.name}": ${tools.length} tools`);
	}

	/**
	 * Refresh tools from all connected servers
	 */
	async refreshAllTools(): Promise<void> {
		const refreshPromises: Promise<void>[] = [];

		for (const serverId of this.clients.keys()) {
			const client = this.clients.get(serverId);

			if (client?.isConnected()) {
				refreshPromises.push(this.refreshServerTools(serverId));
			}
		}

		await Promise.allSettled(refreshPromises);
	}

	/**
	 * Test connection to a server without registering it
	 *
	 * @param config - The server configuration to test
	 * @returns Object with success status and tool count or error message
	 */
	async testConnection(config: MCPServerConfig): Promise<{ success: boolean; toolCount?: number; error?: string }> {
		const client = new MCPClient();

		try {
			await client.connect(config.url, config.auth ? { auth: config.auth } : undefined);

			const tools = await client.listTools();
			await client.disconnect();

			return { success: true, toolCount: tools.length };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			return { success: false, error: errorMessage };
		}
	}
}

/**
 * Singleton instance of the MCP client manager.
 * Use this for application-wide MCP server management.
 */
let mcpClientManagerInstance: MCPClientManager | null = null;

/**
 * Get the global MCP client manager instance
 */
export function getMCPClientManager(): MCPClientManager {
	if (!mcpClientManagerInstance) {
		mcpClientManagerInstance = new MCPClientManager();
	}

	return mcpClientManagerInstance;
}

/**
 * Reset the global MCP client manager instance.
 * Primarily used for testing.
 */
export async function resetMCPClientManager(): Promise<void> {
	if (mcpClientManagerInstance) {
		await mcpClientManagerInstance.disconnectAll();
		mcpClientManagerInstance = null;
	}
}
