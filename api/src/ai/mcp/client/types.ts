import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Authentication configuration for MCP server connections
 */
export interface MCPServerAuth {
	type: 'none' | 'bearer' | 'basic';
	/** Token for bearer authentication */
	token?: string;
	/** Username for basic authentication */
	username?: string;
	/** Password for basic authentication */
	password?: string;
}

/**
 * Configuration for an external MCP server
 */
export interface MCPServerConfig {
	/** Unique identifier for the server */
	id: string;
	/** Display name for the server */
	name: string;
	/** Server URL (HTTP/SSE endpoint) */
	url: string;
	/** Whether the server is enabled */
	enabled: boolean;
	/** Authentication configuration */
	auth?: MCPServerAuth;
	/** Default approval mode for tools from this server */
	toolApproval: 'always' | 'ask' | 'disabled';
}

/**
 * Options for connecting to an MCP server
 */
export interface MCPClientOptions {
	/** Authentication configuration */
	auth?: MCPServerAuth;
	/** Connection timeout in milliseconds */
	timeout?: number;
	/** Custom headers to send with requests */
	headers?: Record<string, string>;
}

/**
 * Result from an MCP tool call
 */
export interface MCPToolResult {
	content: MCPToolResultContent[];
	isError?: boolean;
}

export interface MCPToolResultContent {
	type: 'text' | 'image' | 'resource';
	text?: string;
	data?: string;
	mimeType?: string;
}

/**
 * External MCP tool with server context
 */
export interface ExternalMCPTool {
	/** Full tool name including server prefix: mcp:<server-id>:<tool-name> */
	fullName: string;
	/** Original tool name from the MCP server */
	originalName: string;
	/** Server ID this tool belongs to */
	serverId: string;
	/** Server display name */
	serverName: string;
	/** Tool description */
	description: string;
	/** JSON Schema for tool input */
	inputSchema: Tool['inputSchema'];
	/** Tool approval mode inherited from server config */
	toolApproval: 'always' | 'ask' | 'disabled';
}

/**
 * Connection state for an MCP client
 */
export type MCPConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Error information for MCP operations
 */
export interface MCPError {
	code: string;
	message: string;
	serverId?: string;
	details?: unknown;
}
