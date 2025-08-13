import { ForbiddenError, InvalidPayloadError, isDirectusError } from '@directus/errors';
import type { Query } from '@directus/types';
import { isObject } from '@directus/utils';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
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
	type PromptArgument,
} from '@modelcontextprotocol/sdk/types.js';
import type { Request, Response } from 'express';
import { render, tokenize } from 'micromustache';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { ItemsService } from '../services/index.js';
import { sanitizeQuery } from '../utils/sanitize-query.js';
import { findMcpTool, getAllMcpTools } from './tools/index.js';
import { DirectusTransport } from './transport.js';
import type { MCPOptions, Prompt, ToolResult } from './types.js';

export class DirectusMCP {
	prompts_collection?: string;
	server: Server;
	allow_deletes: boolean;

	constructor(options: MCPOptions) {
		this.prompts_collection = options.prompts_collection;
		this.allow_deletes = typeof options.allow_deletes === 'boolean' ? options.allow_deletes : false;

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
		if (!req.accepts('application/json')) {
			// we currently dont support "text/event-stream" requests
			res.status(400).send();
			return;
		}

		this.server.setNotificationHandler(InitializedNotificationSchema, () => {
			res.status(202).send();
		});

		// list prompts
		this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
			const prompts = [];

			if (!this.prompts_collection) {
				throw new ForbiddenError({ reason: 'A prompts collection must be set in settings' });
			}

			const service = new ItemsService<Prompt>(this.prompts_collection, {
				accountability: req.accountability,
				schema: req.schema,
			});

			try {
				const promptList = await service.readByQuery({
					fields: ['name', 'description', 'system_prompt', 'messages'],
				});

				for (const prompt of promptList) {
					// builds args
					const args: PromptArgument[] = [];

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
						description: prompt.description,
						arguments: args,
					});
				}

				return { prompts };
			} catch (error) {
				return this.toJSONRPCError(error);
			}
		});

		// get prompt
		this.server.setRequestHandler(GetPromptRequestSchema, async (request: GetPromptRequest) => {
			if (!this.prompts_collection) {
				throw new ForbiddenError({ reason: 'A prompts collection must be set in settings' });
			}

			const service = new ItemsService<Prompt>(this.prompts_collection, {
				accountability: req.accountability,
				schema: req.schema,
			});

			const { name: promptName, arguments: args } = request.params;

			try {
				const promptCommand = await service.readByQuery({
					fields: ['name', 'description', 'system_prompt', 'messages'],
					filter: {
						name: {
							_eq: promptName,
						},
					},
				});

				const prompt = promptCommand[0];

				if (!prompt) {
					throw new InvalidPayloadError({ reason: `Invalid prompt "${promptName}"` });
				}

				const messages: GetPromptResult['messages'] = [];

				// Add system prompt as the first assistant message if it exists
				if (prompt.system_prompt) {
					messages.push({
						role: 'assistant',
						content: {
							type: 'text',
							text: render(prompt.system_prompt, args),
						},
					});
				}

				(prompt.messages || []).forEach((message) => {
					// skip invalid prompts
					if (!message.role || !message.text) return;

					messages.push({
						role: message.role,
						content: {
							type: 'text',
							text: render(message.text, args),
						},
					});
				});

				return this.toPromptResponse({
					messages,
					description: prompt.description,
				});
			} catch (error) {
				return this.toJSONRPCError(error);
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

			let sanitizedQuery = {};
			let args;

			try {
				if (!tool) {
					throw new InvalidPayloadError({ reason: `"${tool}" doesn't exist in the toolset` });
				}

				if (req.accountability?.admin !== true && tool.admin === true) {
					throw new ForbiddenError();
				}

				const { error, data } = tool.validateSchema?.safeParse(request.params.arguments) ?? {
					data: request.params.arguments,
				};

				args = data;

				if (error) {
					throw new InvalidPayloadError({ reason: fromZodError(error).message });
				}

				if (!isObject(args)) {
					throw new InvalidPayloadError({ reason: '"arguments" must be an object' });
				}

				if ('action' in args && args['action'] === 'delete' && !this.allow_deletes) {
					throw new InvalidPayloadError({ reason: 'Delete actions are disabled' });
				}

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
			} catch (error) {
				return this.toJSONRPCError(error);
			}

			try {
				const result = await tool.handler({
					args,
					sanitizedQuery,
					schema: req.schema,
					accountability: req.accountability,
				});

				return this.toToolResponse(result);
			} catch (error) {
				return this.toJSONRPCError(error, true);
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

	toJSONRPCError(err: unknown, execution?: boolean) {
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

		if (!execution) {
			return {
				error: errors[0],
			};
		}

		return {
			isError: true,
			content: [{ type: 'text' as const, text: JSON.stringify(errors) }],
		};
	}
}
