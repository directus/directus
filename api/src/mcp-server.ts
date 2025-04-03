#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ListResourcesRequestSchema,
	ListToolsRequestSchema,
	ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import chalk from 'chalk';
import { useLogger } from './logger/index.js';
import type { Accountability } from '@directus/types';
import { createFullyDecoratedResourceHandler, createFullyDecoratedToolHandler } from './mcp/index.js';
import { getSchema } from './utils/get-schema.js';

const logger = useLogger();

// Create admin accountability for service operations
async function getAdminAccountability(): Promise<Accountability> {
	// Create accountability with admin role, which has full permissions
	const accountability: Accountability = {
		admin: true,
		role: null,
		user: null,
		ip: '127.0.0.1',
		userAgent: 'MCP Server',
		app: true,
		roles: [],
	};

	return accountability;
}

export function setupMCPServer() {
	// Initialize the MCP server
	const server = new Server(
		{
			name: 'directus-mcp-server',
			version: '1.0.0',
		},
		{
			capabilities: {
				tools: {},
				resources: {
					listChanged: true,
					subscribe: true,
				},
			},
		},
	);

	server.setRequestHandler(ListResourcesRequestSchema, async () => {
		try {
			console.log('prout')
			// Get admin accountability
			const accountability = await getAdminAccountability();
			const schema = await getSchema();

			// Create a decorated handler with all tools
			const handler = createFullyDecoratedResourceHandler(accountability, schema);

			console.log('listing resources', handler.listResources());

			// Return the list of available resources
			return {
				resources: await handler.listResources(),
			};
		} catch (error) {
			if (error instanceof Error) {
				logger.error(`Error listing MCP resources: ${error.message}`);
				return {
					resources: [],
				};
			}
			logger.error(`Error listing MCP resources: ${String(error)}`);
			return {
				resources: [],
			};
		}
	});

	server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
		const uri = request.params.uri;

		try {
			// Get admin accountability
			const accountability = await getAdminAccountability();
			const schema = await getSchema();

			// Create a decorated handler
			const handler = createFullyDecoratedResourceHandler(accountability, schema);

			// Use the handler to process the resource call
			return await handler.handleResourceCall(uri);
		} catch (error) {
			if (error instanceof Error) {
				logger.error(`Error executing MCP resource ${uri}: ${error.message}`);
				return {
					content: [
						{
							type: 'text',
							text: `Error executing resource ${uri}: ${error.message}`,
						},
					],
					isError: true,
				};
			}
			logger.error(`Error executing MCP resource ${uri}: ${String(error)}`);
			return {
				content: [
					{
						type: 'text',
						text: `Error executing resource ${uri}: ${String(error)}`,
					},
				],
				isError: true,
			};
		}
	});

	// Set up request handlers
	server.setRequestHandler(ListToolsRequestSchema, async () => {
		try {
			// Get admin accountability
			const accountability = await getAdminAccountability();
			const schema = await getSchema();

			// Create a decorated handler with all tools
			const handler = createFullyDecoratedToolHandler(accountability, schema);

			// Return the list of available tools
			return {
				tools: await handler.getTools(),
			};
		} catch (error) {
			if (error instanceof Error) {
				logger.error(`Error listing MCP tools: ${error.message}`);
				return {
					isError: true,
					tools: [],
				};
			}
			logger.error(`Error listing MCP tools: ${String(error)}`);
			return {
				isError: true,
				tools: [],
			};
		}
	});

	server.setRequestHandler(CallToolRequestSchema, async (request) => {
		const toolName = request.params.name;
		const args = request.params.arguments || {};

		try {
			// Get admin accountability
			const accountability = await getAdminAccountability();
			const schema = await getSchema();

			// Create a decorated handler
			const handler = createFullyDecoratedToolHandler(accountability, schema);

			// Use the handler to process the tool call
			const ret = await handler.handleToolCall(toolName, args);
			console.log('ret', ret);
			return ret;
		} catch (error) {
			if (error instanceof Error) {
				logger.error(`Error executing MCP tool ${toolName}: ${error.message}`);
				return {
					content: [
						{
							type: 'text',
							text: `Error executing tool ${toolName}: ${error.message}; ${error}`,
						},
					],
					isError: true,
				};
			}

			logger.error(`Error executing MCP tool ${toolName}: ${String(error)}`);
			return {
				content: [
					{
						type: 'text',
						text: `Error executing tool ${toolName}: ${String(error)}`,
					},
				],
				isError: true,
			};
		}
	});

	return server;
}

// Start the server
export async function runStdioServer() {
	logger.info(chalk.green('Starting Directus MCP Server...'));
	const transport = new StdioServerTransport();
	await setupMCPServer().connect(transport);
	logger.info(chalk.green('Directus MCP Server connected and ready'));
	return transport;
}
