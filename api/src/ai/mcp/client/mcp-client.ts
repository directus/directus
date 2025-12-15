import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { useLogger } from '../../../logger/index.js';
import type { MCPClientOptions, MCPConnectionState, MCPServerAuth, MCPToolResult } from './types.js';

const logger = useLogger();

/**
 * MCP Client for connecting to external MCP servers via HTTP/SSE transport.
 *
 * This client supports both the modern StreamableHTTP transport and falls back
 * to legacy SSE transport for backwards compatibility with older MCP servers.
 */
export class MCPClient {
	private client: Client | null = null;
	private transport: StreamableHTTPClientTransport | SSEClientTransport | null = null;
	private _state: MCPConnectionState = 'disconnected';
	private _url: string | null = null;
	private _options: MCPClientOptions | null = null;
	private _serverInfo: { name?: string; version?: string } | null = null;

	/**
	 * Get the current connection state
	 */
	get state(): MCPConnectionState {
		return this._state;
	}

	/**
	 * Get the connected server URL
	 */
	get url(): string | null {
		return this._url;
	}

	/**
	 * Get server info from the connection
	 */
	get serverInfo(): { name?: string; version?: string } | null {
		return this._serverInfo;
	}

	/**
	 * Check if the client is connected
	 */
	isConnected(): boolean {
		return this._state === 'connected' && this.client !== null;
	}

	/**
	 * Build request headers for authentication
	 */
	private buildAuthHeaders(auth?: MCPServerAuth): Record<string, string> {
		const headers: Record<string, string> = {};

		if (!auth || auth.type === 'none') {
			return headers;
		}

		if (auth.type === 'bearer' && auth.token) {
			headers['Authorization'] = `Bearer ${auth.token}`;
		} else if (auth.type === 'basic' && auth.username && auth.password) {
			const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
			headers['Authorization'] = `Basic ${credentials}`;
		}

		return headers;
	}

	/**
	 * Connect to an external MCP server via HTTP/SSE transport.
	 *
	 * Attempts to connect using StreamableHTTP transport first, then falls back
	 * to legacy SSE transport if that fails.
	 *
	 * @param url - The MCP server URL
	 * @param options - Connection options including authentication
	 */
	async connect(url: string, options?: MCPClientOptions): Promise<void> {
		if (this._state === 'connected') {
			logger.warn(`MCP client already connected to ${this._url}`);
			return;
		}

		this._state = 'connecting';
		this._url = url;
		this._options = options ?? null;

		const authHeaders = this.buildAuthHeaders(options?.auth);
		const customHeaders = options?.headers ?? {};
		const allHeaders = { ...authHeaders, ...customHeaders };

		this.client = new Client(
			{
				name: 'directus-mcp-client',
				version: '1.0.0',
			},
			{
				capabilities: {},
			},
		);

		const serverUrl = new URL(url);

		// Try StreamableHTTP transport first (modern)
		try {
			logger.debug(`Attempting StreamableHTTP connection to ${url}`);

			this.transport = new StreamableHTTPClientTransport(serverUrl, {
				requestInit: {
					headers: allHeaders,
				},
			});

			// Cast transport to satisfy exact optional property types
			await this.client.connect(this.transport as Parameters<typeof this.client.connect>[0]);
			this._serverInfo = this.client.getServerVersion() ?? null;
			this._state = 'connected';

			logger.info(`Connected to MCP server at ${url} via StreamableHTTP`);
			return;
		} catch (streamableError) {
			logger.debug(`StreamableHTTP connection failed, trying SSE fallback: ${streamableError}`);
		}

		// Fallback to legacy SSE transport
		try {
			logger.debug(`Attempting SSE connection to ${url}`);

			// Reset client for new connection attempt
			this.client = new Client(
				{
					name: 'directus-mcp-client',
					version: '1.0.0',
				},
				{
					capabilities: {},
				},
			);

			this.transport = new SSEClientTransport(serverUrl, {
				requestInit: {
					headers: allHeaders,
				},
			});

			// Cast transport to satisfy exact optional property types
			await this.client.connect(this.transport as Parameters<typeof this.client.connect>[0]);
			this._serverInfo = this.client.getServerVersion() ?? null;
			this._state = 'connected';

			logger.info(`Connected to MCP server at ${url} via SSE (legacy)`);
		} catch (sseError) {
			this._state = 'error';
			this.client = null;
			this.transport = null;

			const errorMessage = sseError instanceof Error ? sseError.message : String(sseError);
			logger.error(`Failed to connect to MCP server at ${url}: ${errorMessage}`);

			throw new Error(`Failed to connect to MCP server at ${url}: ${errorMessage}`);
		}
	}

	/**
	 * List available tools from the connected MCP server
	 *
	 * @returns Array of tools provided by the server
	 */
	async listTools(): Promise<Tool[]> {
		if (!this.isConnected() || !this.client) {
			throw new Error('MCP client is not connected');
		}

		try {
			const result = await this.client.listTools();
			return result.tools;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			logger.error(`Failed to list tools from MCP server: ${errorMessage}`);
			throw new Error(`Failed to list tools: ${errorMessage}`);
		}
	}

	/**
	 * Call a tool on the connected MCP server
	 *
	 * @param name - The tool name
	 * @param args - Arguments to pass to the tool
	 * @returns The tool result
	 */
	async callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult> {
		if (!this.isConnected() || !this.client) {
			throw new Error('MCP client is not connected');
		}

		try {
			logger.debug(`Calling MCP tool: ${name}`);

			const result = await this.client.callTool({
				name,
				arguments: args,
			});

			const isError = result.isError === true;

			return {
				content: (result.content as MCPToolResult['content']) ?? [],
				isError,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			logger.error(`Failed to call MCP tool "${name}": ${errorMessage}`);
			throw new Error(`Failed to call tool "${name}": ${errorMessage}`);
		}
	}

	/**
	 * Disconnect from the MCP server
	 */
	async disconnect(): Promise<void> {
		if (this._state === 'disconnected') {
			return;
		}

		try {
			if (this.client) {
				await this.client.close();
			}
		} catch (error) {
			logger.warn(`Error while disconnecting from MCP server: ${error}`);
		} finally {
			this.client = null;
			this.transport = null;
			this._state = 'disconnected';
			this._serverInfo = null;

			logger.debug(`Disconnected from MCP server at ${this._url}`);
		}
	}

	/**
	 * Reconnect to the MCP server using the previous connection settings
	 */
	async reconnect(): Promise<void> {
		if (!this._url) {
			throw new Error('No previous connection URL available for reconnection');
		}

		await this.disconnect();
		await this.connect(this._url, this._options ?? undefined);
	}
}
