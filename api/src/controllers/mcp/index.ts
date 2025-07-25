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

/**
 * Format a success response for the MCP server.
 * @param data - The data to format.
 * @param message - The message to send to the user.
 * @returns The formatted success response.
 */
export const formatSuccessResponse = (data: unknown, message?: string) => {
	if (message) {
		const formatted = `<data>\n${JSON.stringify(data, null, 2)}\n</data>\n<message>\n${message}\n</message>`;
		return {
			content: [{ type: 'text' as const, text: `${formatted}` }],
		};
	}

	return {
		content: [{ type: 'text' as const, text: `${JSON.stringify(data, null, 2)}` }],
	};
};

/**
 * Format an error response for the MCP server.
 * @param error - The error to format.
 */
export const formatErrorResponse = (error: unknown) => {
	let errorPayload: Record<string, unknown>;

	if (isDirectusError(error)) {
		// Handle Directus API errors
		errorPayload = {
			directusApiErrors: error.errors.map((e: DirectusApiError) => ({
				message: e.message || 'Unknown error',
				code: e.extensions?.code,
			})),
		};
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

		errorPayload = { error: message, ...(code && { code }) };
	}

	return {
		isError: true,
		content: [{ type: 'text' as const, text: JSON.stringify(errorPayload) }],
	};
};

const server = new McpServer(
	{
		name: 'directus-mcp',
		version: '0.1.0',
	},
	{
		capabilities: {},
	},
);

server.registerTool(
	'ping',
	{
		title: 'ping pong!',
	},
	(args) => {
		return formatSuccessResponse({ args }, 'pong');
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
