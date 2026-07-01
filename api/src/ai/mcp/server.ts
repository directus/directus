import { isDirectusError } from '@directus/errors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
	type CallToolRequest,
	CallToolRequestSchema,
	type CallToolResult,
	type GetPromptRequest,
	GetPromptRequestSchema,
	type GetPromptResult,
	InitializedNotificationSchema,
	ErrorCode as JSONRPCErrorCode,
	JSONRPCMessageSchema,
	ListPromptsRequestSchema,
	ListToolsRequestSchema,
	McpError,
	type PromptArgument,
} from '@modelcontextprotocol/sdk/types.js';
import type { Request, Response } from 'express';
import { render, tokenize } from 'micromustache';
import { z } from 'zod';
import { ItemsService } from '../../services/index.js';
import type { RegistryError, RegistryExecuteResult } from '../tools/index.js';
import { ALL_TOOLS, ToolRegistry } from '../tools/index.js';
import type { ToolConfig, ToolResult } from '../tools/types.js';
import { DirectusTransport } from './transport.js';
import type { MCPOptions, Prompt } from './types.js';
import { buildMcpWWWAuthenticateHeader, getMcpUrls, MCP_ACCESS_SCOPE } from './utils.js';

export class DirectusMCP {
	promptsCollection?: string | null;
	systemPrompt?: string | null;
	systemPromptEnabled?: boolean;
	server: Server;
	allowDeletes?: boolean;

	constructor(options: MCPOptions = {}) {
		this.promptsCollection = options.promptsCollection ?? null;
		this.systemPromptEnabled = options.systemPromptEnabled ?? true;
		this.systemPrompt = options.systemPrompt ?? null;
		this.allowDeletes = options.allowDeletes ?? false;

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
	 * Send a 401 with WWW-Authenticate per RFC 6750 / RFC 9728.
	 * Includes `resource_metadata` pointing to `/.well-known/oauth-protected-resource/mcp`
	 * so clients can discover the authorization server from a 401 response.
	 */
	private sendUnauthorized(res: Response, error?: string, status = 401): void {
		const { metadataUrl } = getMcpUrls();

		res
			.set('WWW-Authenticate', buildMcpWWWAuthenticateHeader(metadataUrl, error))
			.set('Access-Control-Expose-Headers', 'WWW-Authenticate')
			.status(status)
			.send();
	}

	/**
	 * Handle an incoming MCP JSON-RPC request.
	 *
	 * OAuth-specific checks (when `accountability.oauth` is set):
	 * - Transport restriction: token must be in Authorization header (RFC 6750), not cookie/query
	 * - Scope check: must include mcp:access
	 * - Audience check: must match the canonical MCP resource URL (PUBLIC_URL/mcp)
	 *
	 * Note: this function does not await lower-level logic; the actual response is an
	 * asynchronous side effect happening after the function returns.
	 *
	 * @see sendUnauthorized for WWW-Authenticate format (RFC 9728 `resource_metadata` attribute)
	 */
	handleRequest(req: Request, res: Response) {
		const oauth = req.accountability?.oauth;

		// Unauthenticated: no user, no role, not admin
		if (!req.accountability?.user && !req.accountability?.role && req.accountability?.admin !== true) {
			this.sendUnauthorized(res);
			return;
		}

		// OAuth-specific restrictions (scope, audience, transport already resolved onto accountability)
		if (oauth) {
			if (req.tokenSource !== 'header') {
				this.sendUnauthorized(res, 'invalid_request');
				return;
			}

			if (!oauth.scopes.includes(MCP_ACCESS_SCOPE)) {
				this.sendUnauthorized(res, 'insufficient_scope', 403);
				return;
			}

			const { resourceUrl } = getMcpUrls();

			if (!oauth.aud.includes(resourceUrl)) {
				this.sendUnauthorized(res, 'invalid_token');
				return;
			}
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

		const mountedRegistry = new ToolRegistry(ALL_TOOLS).mount({
			accountability: req.accountability,
			allowDeletes: this.allowDeletes,
			isToolCallApproved: () => true,
			schema: req.schema,
			systemPrompt: this.systemPrompt,
			systemPromptEnabled: this.systemPromptEnabled,
		});

		const useRegistryTools = req.query?.['tool_mode'] === 'registry';

		// listing tools
		this.server.setRequestHandler(ListToolsRequestSchema, () => {
			return {
				tools: (useRegistryTools ? mountedRegistry.getRootTools() : mountedRegistry.tools).map((tool) =>
					this.toMcpTool(tool),
				),
			};
		});

		// calling tools
		this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
			try {
				const result = useRegistryTools
					? await mountedRegistry.executeRoot(request.params.name, request.params.arguments)
					: await mountedRegistry.execute(request.params.name, request.params.arguments);

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

	toMcpTool(tool: ToolConfig<any>) {
		const mcpTool: {
			annotations?: ToolConfig<any>['annotations'];
			description: string;
			inputSchema: unknown;
			name: string;
			outputSchema?: unknown;
		} = {
			name: tool.name,
			description: tool.description,
			inputSchema: z.toJSONSchema(tool.inputSchema),
			annotations: tool.annotations,
		};

		if (tool.output) {
			mcpTool.outputSchema = z.toJSONSchema(tool.output);
		}

		return mcpTool;
	}

	toToolResponse(executeResult: RegistryExecuteResult): CallToolResult {
		if (!executeResult.ok) {
			return this.toRegistryErrorResponse(executeResult.error);
		}

		return this.toResultResponse(executeResult.result, executeResult.structuredContent);
	}

	toResultResponse(result?: ToolResult, structuredContent?: unknown): CallToolResult {
		const response: CallToolResult = {
			content: [],
		};

		if (!result || typeof result.data === 'undefined' || result.data === null) return response;

		if (structuredContent !== undefined) {
			response.structuredContent = structuredContent as CallToolResult['structuredContent'];
		}

		if (result.type === 'text') {
			const textPayload =
				structuredContent !== undefined
					? {
							...(structuredContent as Record<string, unknown>),
							...(result.url && { url: result.url }),
						}
					: {
							data: result.data,
							...(result.url && { url: result.url }),
						};

			response.content.push({
				type: 'text',
				text: JSON.stringify(textPayload),
			});
		} else {
			response.content.push(result);
		}

		return response;
	}

	toRegistryErrorResponse(error: RegistryError): CallToolResult {
		return {
			isError: true,
			content: [
				{
					type: 'text',
					text: JSON.stringify([
						{
							error: error.message,
							code: error.code,
							recoverable: error.recoverable,
							...(error.next && { next: error.next }),
						},
					]),
				},
			],
		};
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
