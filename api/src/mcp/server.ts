import { useEnv } from '@directus/env';
import { ForbiddenError, InvalidPayloadError, isDirectusError } from '@directus/errors';
import { isSystemCollection } from '@directus/system-data';
import type { Query } from '@directus/types';
import { isObject, parseJSON, toArray } from '@directus/utils';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
	CallToolRequestSchema,
	GetPromptRequestSchema,
	InitializedNotificationSchema,
	ErrorCode as JSONRPCErrorCode,
	JSONRPCMessageSchema,
	ListPromptsRequestSchema,
	ListToolsRequestSchema,
	McpError,
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
import { Url } from '../utils/url.js';
import { findMcpTool, getAllMcpTools } from './tools/index.js';
import { DirectusTransport } from './transport.js';
import type { MCPOptions, Prompt, ToolConfig, ToolResult } from './types.js';

export class DirectusMCP {
	promptsCollection?: string | null;
	systemPrompt?: string | null;
	systemPromptEnabled?: boolean;
	server: Server;
	allowDeletes?: boolean;
	allowSystemCollections?: boolean;

	constructor(options: MCPOptions = {}) {
		this.promptsCollection = options.promptsCollection ?? null;
		this.systemPromptEnabled = options.systemPromptEnabled ?? true;
		this.systemPrompt = options.systemPrompt ?? null;
		this.allowDeletes = options.allowDeletes ?? false;
		this.allowSystemCollections = options.allowSystemCollections ?? false;

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
		if (!req.accountability?.user && !req.accountability?.role && req.accountability?.admin !== true) {
			throw new ForbiddenError();
		}

		if (!req.accepts('application/json')) {
			// we currently dont support "text/event-stream" requests
			res.status(405).send();
			return;
		}

		this.server.setNotificationHandler(InitializedNotificationSchema, () => {
			res.status(202).send();
		});

		// list prompts
		this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
			const prompts = [];

			if (!this.promptsCollection) {
				throw new McpError(1001, `A prompts collection must be set in settings`);
			}

			const service = new ItemsService<Prompt>(this.promptsCollection, {
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

					// Add system prompt as the first assistant message if it exists
					if (prompt.system_prompt) {
						for (const varName of tokenize(prompt.system_prompt).varNames) {
							args.push({
								name: varName,
								description: `Value for ${varName}`,
								required: false,
							});
						}
					}

					for (const message of prompt.messages || []) {
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
				return this.toExecutionError(error);
			}
		});

		// get prompt
		this.server.setRequestHandler(GetPromptRequestSchema, async (request: GetPromptRequest) => {
			if (!this.promptsCollection) {
				throw new McpError(1001, `A prompts collection must be set in settings`);
			}

			const service = new ItemsService<Prompt>(this.promptsCollection, {
				accountability: req.accountability,
				schema: req.schema,
			});

			const { name: promptName, arguments: args } = request.params;

			const promptCommand = await service.readByQuery({
				fields: ['description', 'system_prompt', 'messages'],
				filter: {
					name: {
						_eq: promptName,
					},
				},
			});

			const prompt = promptCommand[0];

			if (!prompt) {
				throw new McpError(JSONRPCErrorCode.InvalidParams, `Invalid prompt "${promptName}"`);
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

			// render any provided args
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
		});

		// listing tools
		this.server.setRequestHandler(ListToolsRequestSchema, () => {
			const tools = [];

			for (const tool of getAllMcpTools()) {
				if (req.accountability?.admin !== true && tool.admin === true) continue;
				if (tool.name === 'system-prompt' && this.systemPromptEnabled === false) continue;

				tools.push({
					name: tool.name,
					description: tool.description,
					inputSchema: z.toJSONSchema(tool.inputSchema),
					annotations: tool.annotations,
				});
			}

			return { tools };
		});

		// calling tools
		this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
			const tool = findMcpTool(request.params.name);

			let sanitizedQuery = {};

			try {
				if (!tool || (tool.name === 'system-prompt' && this.systemPromptEnabled === false)) {
					throw new InvalidPayloadError({ reason: `"${request.params.name}" doesn't exist in the toolset` });
				}

				if (req.accountability?.admin !== true && tool.admin === true) {
					throw new ForbiddenError({ reason: 'You must be an admin to access this tool' });
				}

				if (tool.name === 'system-prompt') {
					request.params.arguments = { promptOverride: this.systemPrompt };
				}

				// ensure json expected fields are not stringified
				if (request.params.arguments) {
					for (const field of ['data', 'keys', 'query']) {
						const arg = request.params.arguments[field];

						if (typeof arg === 'string') {
							request.params.arguments[field] = parseJSON(arg);
						}
					}
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

				if ('action' in args && args['action'] === 'delete' && !this.allowDeletes) {
					throw new InvalidPayloadError({ reason: 'Delete actions are disabled' });
				}

				if (
					tool.name === 'items' &&
					'collection' in args &&
					isSystemCollection(args['collection'] as string) &&
					!this.allowSystemCollections
				) {
					throw new InvalidPayloadError({ reason: 'Cannot provide a core collection' });
				}

				if ('query' in args && args['query']) {
					sanitizedQuery = await sanitizeQuery(
						{
							fields: (args['query'] as Query)['fields'] || '*',
							...args['query'],
						},
						req.schema,
						req.accountability,
					);
				}

				const result = await tool.handler({
					args,
					sanitizedQuery,
					schema: req.schema,
					accountability: req.accountability,
				});

				// if single item and create/read/update/import add url
				const data = toArray(result?.data);

				if (
					'action' in args &&
					['create', 'update', 'read', 'import'].includes(args['action'] as string) &&
					result?.data &&
					data.length === 1
				) {
					result.url = this.buildURL(tool, args, data[0]);
				}

				return this.toToolResponse(result);
			} catch (error) {
				return this.toExecutionError(error);
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

	buildURL(tool: ToolConfig<unknown>, input: unknown, data: unknown) {
		const env = useEnv();

		const publicURL = env['PUBLIC_URL'] as string | undefined;

		if (!publicURL) return;

		if (!tool.endpoint) return;

		const path = tool.endpoint({ input, data });

		if (!path) return;

		return new Url(env['PUBLIC_URL'] as string).addPath('admin', ...path).toString();
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
				text: JSON.stringify({ raw: result.data, url: result.url }),
			});
		} else {
			response.content.push(result);
		}

		return response;
	}

	toExecutionError(err: unknown) {
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
