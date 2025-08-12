import { useEnv } from '@directus/env';
import { ForbiddenError, InvalidPayloadError, isDirectusError } from '@directus/errors';
import type { Query } from '@directus/types';
import { isObject } from '@directus/utils';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import {
	CallToolRequestSchema,
	GetPromptRequestSchema,
	InitializedNotificationSchema,
	JSONRPCMessageSchema,
	ListPromptsRequestSchema,
	ListToolsRequestSchema,
	type CallToolRequest,
	type CallToolResult,
	type GetPromptRequest,
	type GetPromptResult,
	type JSONRPCMessage,
	type MessageExtraInfo,
} from '@modelcontextprotocol/sdk/types.js';
import type { Request, Response } from 'express';
import { render, tokenize } from 'micromustache';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { ItemsService } from '../services/index.js';
import { sanitizeQuery } from '../utils/sanitize-query.js';
import { findMcpTool, getAllMcpTools } from './tools/index.js';
import type { Prompt, PromptArg, ToolResult } from './types.js';

export class DirectusTransport implements Transport {
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
		this.res.json(message);
	}

	async close(): Promise<void> {
		return;
	}
}

export class DirectusMCP {
	server: Server;

	constructor() {
		this.server = new Server(
			{
				name: 'directus-mcp',
				version: '0.1.0',
			},
			{
				capabilities: {
					tools: {},
					prompts: {},
				},
			},
		);
	}

	/**
	 * This handleRequest function is not awaiting lower level logic resulting in the actual
	 * response being an asynchronous side effect happening after the function has returned
	 */
	handleRequest(req: Request, res: Response) {
		const env = useEnv();

		if (!req.accepts('application/json')) {
			// we currently dont support "text/event-stream" requests
			res.status(400).send();
			return;
		}

		this.server.setNotificationHandler(InitializedNotificationSchema, () => {
			res.status(202).send();
		});

		this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
			const prompts = [];

			try {
				const promptList = await new ItemsService<Prompt>('mcp_prompts', {
					schema: req.schema,
					accountability: req.accountability,
				}).readByQuery({});

				for (const prompt of promptList) {
					// builds args
					const args: PromptArg[] = [];

					for (const message of prompt.messages) {
						for (const varName of tokenize(message.text).varNames) {
							args.push({
								name: varName,
								description: `Value for ${varName}`,
								required: false,
							});
						}
					}

					prompts.push({
						name: prompt.name,
						title: prompt.title,
						description: prompt.description,
						arguments: args,
					});
				}
			} catch {
				//
			}

			return { prompts };
		});

		this.server.setRequestHandler(GetPromptRequestSchema, async (request: GetPromptRequest) => {
			try {
				const promptCommand = await new ItemsService<Prompt>('mcp_prompts', {
					schema: req.schema,
					accountability: req.accountability,
				}).readByQuery({
					filter: {
						name: {
							_eq: request.params.name,
						},
					},
				});

				const prompt = promptCommand[0];

				if (!prompt) {
					throw new Error('halo');
				}

				const messages: GetPromptResult['messages'] = (prompt.messages || []).map((message) => ({
					role: message.role,
					content: {
						type: 'text',
						text: render(message.text, request.params.arguments),
					},
				}));

				return this.toPromptResponse({
					messages,
					description: prompt.description,
				});
			} catch {
				//
				return {};
			}
		});

		// listing tools
		this.server.setRequestHandler(ListToolsRequestSchema, () => {
			const tools = [];

			for (const tool of getAllMcpTools()) {
				if (req.accountability?.admin !== true && tool.admin === true) continue;

				tools.push({
					name: tool.name,
					description: tool.description,
					inputSchema: z.toJSONSchema(tool.inputSchema, { reused: 'ref' }),
					annotations: tool.annotations,
				});
			}

			return { tools };
		});

		// calling tools
		this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
			const tool = findMcpTool(request.params.name);

			try {
				if (!tool) {
					throw new InvalidPayloadError({ reason: `${tool} doesn't exist in the toolset` });
				}

				if (req.accountability?.admin !== true && tool.admin === true) {
					throw new ForbiddenError();
				}

				const { error, data: args } = tool.validateSchema?.safeParse(request.params.arguments) ?? {
					data: request.params.arguments,
				};

				if (error) {
					throw new InvalidPayloadError({ reason: fromZodError(error).message });
				}

				if (!isObject(args)) {
					throw new InvalidPayloadError({ reason: '"arguments" must be an object' });
				}

				if ('action' in args && args['action'] === 'delete' && env['MCP_PREVENT_DELETE'] === true) {
					throw new InvalidPayloadError({ reason: 'Delete actions are disabled' });
				}

				let sanitizedQuery = {};

				if ('query' in args && args['query']) {
					sanitizedQuery = await sanitizeQuery(
						{
							fields: (args['query'] as Query)['fields'] || '*',
							...args['query'],
						},
						req.schema,
						req.accountability || null,
					);
				}

				const result = await tool.handler({
					args,
					sanitizedQuery,
					schema: req.schema,
					accountability: req.accountability,
				});

				return this.toToolResponse(result);
			} catch (error) {
				return this.toToolError(error);
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

	toPromptResponse(result: {
		description?: string | undefined;
		messages: GetPromptResult['messages'];
	}): GetPromptResult {
		const response: GetPromptResult = {
			messages: result.messages,
		};

		if (result.description) {
			response.description = result.description;
		}

		return response;
	}

	toToolResponse(result?: ToolResult) {
		const response: CallToolResult = {
			content: [],
		};

		if (!result || typeof result.data === 'undefined' || result.data === null) return response;

		if (result.type === 'text') {
			response.content.push({
				type: 'text',
				text: JSON.stringify(result.data),
			});
		} else {
			response.content.push(result);
		}

		return response;
	}

	toToolError(err: unknown): CallToolResult {
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
