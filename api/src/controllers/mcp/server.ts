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
import type { ToolDefinition } from './tool.js';
import { formatErrorResponse, formatSuccessResponse } from './util.js';

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
	tools: Map<string, ToolDefinition>;
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

		this.tools = new Map();
	}

	handleRequest(req: Request, res: Response) {
		this.server.setRequestHandler(ListToolsRequestSchema, async () => {
			return { tools: {} };
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
				await tool.argSchema?.parseAsync(request.params.arguments);

				const result = await tool.handler({ args: request.params.arguments, accountability: req.accountability });

				return formatSuccessResponse(result.data, result.message);
			} catch (error) {
				return formatErrorResponse(error);
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
}
