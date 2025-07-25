import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Transport, TransportSendOptions } from '@modelcontextprotocol/sdk/shared/transport.js';
import { JSONRPCMessageSchema, type JSONRPCMessage, type MessageExtraInfo } from '@modelcontextprotocol/sdk/types.js';
import { Router, type Request, type Response } from 'express';
import asyncHandler from '../../utils/async-handler.js';

class DirectusTransport implements Transport {
	private res: Response;
	onerror?: (error: Error) => void;
	onmessage?: (message: JSONRPCMessage, extra?: MessageExtraInfo) => void;
	onclose?: () => void;
	constructor(res: Response) {
		this.res = res;
	}

	async start(): Promise<void> {
		return;
	}

	async send(message: JSONRPCMessage, options?: TransportSendOptions): Promise<void> {
		this.res.json({
			message,
			options,
		});
	}

	async close(): Promise<void> {
		return;
	}

	handleMessage(req: Request) {
		// handle

		try {
			const parsedMessage = JSONRPCMessageSchema.parse(req.body);
			this.onmessage?.(parsedMessage);
		} catch (error) {
			this.onerror?.(error as Error);

			throw error;
		}
	}
}

const server = new McpServer(
	{
		name: 'directus-mcp',
		version: '0.1.0',
	},
	{
		capabilities: {},
	},
);

const router = Router();

router.get(
	'/',
	asyncHandler(async (req, res) => {
		const transport = new DirectusTransport(res);

		await server.connect(transport);

		transport.handleMessage(req);
	}),
);

router.post(
	'/',
	asyncHandler(async (req, res) => {
		const transport = new DirectusTransport(res);
		await server.connect(transport);
		transport.handleMessage(req);
	}),
);

export default router;
