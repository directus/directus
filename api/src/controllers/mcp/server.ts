import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { JSONRPCMessageSchema, type JSONRPCMessage, type MessageExtraInfo } from '@modelcontextprotocol/sdk/types.js';
import type { Request, Response } from 'express';

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
	server: McpServer;
	constructor() {
		this.server = new McpServer(
			{
				name: 'directus-mcp',
				version: '0.1.0',
			},
			{
				capabilities: {},
			},
		);
	}

	handleRequest(req: Request, res: Response) {
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
