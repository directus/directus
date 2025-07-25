import { isDirectusError } from '@directus/errors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import {
	CallToolRequestSchema,
	JSONRPCMessageSchema,
	ListToolsRequestSchema,
	type CallToolRequest,
	type JSONRPCMessage,
	type MessageExtraInfo,
} from '@modelcontextprotocol/sdk/types.js';
import type { Request, Response } from 'express';
import { z } from 'zod';
import type { ToolConfig } from './tool.js';
import * as tools from './tools/index.js';

class DirectusTransport implements Transport {
	res: Response;
	onerror?: (error: Error) => void;
	onmessage?: (message: JSONRPCMessage, extra?: MessageExtraInfo) => void;
	onclose?: () => void;
	constructor(res: Response) {
		this.res = res;
	}

	async start(): Promise<void> {
		return;
	}

	async send(message: JSONRPCMessage): Promise<void> {
		this.res.json({
			message,
		});
	}

	async close(): Promise<void> {
		return;
	}
}

export class DirectusMCP {
	server: Server;
	tools: Map<string, ToolConfig>;
	constructor() {
		this.server = new Server(
			{
				name: 'directus-mcp',
				version: '0.1.0',
			},
			{
				capabilities: {},
			},
		);

		this.tools = new Map([['items', tools.items]]);
	}

	handleRequest(req: Request, res: Response) {
		this.server.setRequestHandler(ListToolsRequestSchema, async () => {
			const tools = [];

			for (const [, tool] of this.tools) {
				if (req.accountability?.admin !== true && tool.admin === true) continue;

				tools.push({
					name: tool.name,
					description: tool.description,
					inputSchema: tool.inputSchema ? z.toJSONSchema(tool.inputSchema, { reused: 'ref' }) : undefined,
					annotations: tool.annotations,
				});
			}

			return { tools };
		});

		// Manage tool requests
		this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
			const tool = this.tools.get(request.params.name);

			if (!tool) {
				throw new Error('Invalid Tool');
			}

			if (req.accountability?.admin !== true && tool.admin === true) {
				throw new Error('Admin Tool');
			}

			try {
				await tool.inputSchema?.parseAsync(request.params.arguments);

				const result = await tool.handler({
					args: request.params.arguments,
					schema: req.schema,
					accountability: req.accountability,
				});

				return this.toMCPResponse(result.data, result.message);
			} catch (error) {
				return this.toMCPError(error);
			}
		});

		const transport = new DirectusTransport(res);

		this.server.connect(transport);

		try {
			const parsedMessage = JSONRPCMessageSchema.parse(req.body);
			transport.onmessage?.(parsedMessage);
		} catch (error) {
			transport.onerror?.(error as Error);

			throw error;
		}
	}

	toMCPResponse(data: unknown, message?: string) {
		const formattedValue = message
			? `<data>\n${JSON.stringify(data, null, 2)}\n</data>\n<message>\n${message}\n</message>`
			: `${JSON.stringify(data, null, 2)}`;

		return {
			content: [{ type: 'text', text: formattedValue }],
		};
	}

	toMCPError(err: unknown) {
		const errors: { error: string; code?: string }[] = [];
		const receivedErrors: unknown[] = Array.isArray(err) ? err : [err];

		for (const error of receivedErrors) {
			if (isDirectusError(error)) {
				errors.push({
					error: error.message || 'Unknown error',
					code: error.code,
				});
			} else {
				// Handle generic errors
				let message = 'An unknown error occurred.';
				let code: string | undefined;

				if (error instanceof Error) {
					message = error.message;
					code = 'code' in error ? String(error.code) : undefined;
				} else if (typeof error === 'object' && error !== null) {
					message = 'message' in error ? String(error.message) : message;
					code = 'code' in error ? String(error.code) : undefined;
				} else if (typeof error === 'string') {
					message = error;
				}

				errors.push({ error: message, ...(code && { code }) });
			}
		}

		return {
			isError: true,
			content: [{ type: 'text' as const, text: JSON.stringify(errors) }],
		};
	}
}
