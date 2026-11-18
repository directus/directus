import { ForbiddenError, InvalidPayloadError, isDirectusError } from '@directus/errors';
import { toNodeHandler } from '@modelcontextprotocol/node';
import {
	type CallToolResult,
	createMcpHandler,
	type GetPromptResult,
	type PromptArgument,
	ProtocolError,
	ProtocolErrorCode,
	Server,
	type Tool,
} from '@modelcontextprotocol/server';
import type { Request, Response } from 'express';
import { render, tokenize } from 'micromustache';
import { z } from 'zod';
import { ItemsService } from '../../services/index.js';
import { ALL_TOOLS, type RegistryError, type RegistryExecuteResult, ToolRegistry } from '../tools/index.js';
import type { RootTool, ToolResult } from '../tools/types.js';
import { getServerInfo } from './server-info.js';
import type { MCPOptions, MCPProject, Prompt } from './types.js';
import { buildMcpWWWAuthenticateHeader, getMcpUrls, MCP_ACCESS_SCOPE } from './utils.js';

type McpToolMode = 'legacy' | 'registry';

export class DirectusMCP {
	project: MCPProject;
	promptsCollection?: string | null;
	systemPrompt?: string | null;
	systemPromptEnabled?: boolean;
	allowDeletes?: boolean;

	constructor(options: MCPOptions = {}) {
		this.project = options.project ?? {};
		this.promptsCollection = options.promptsCollection ?? null;
		this.systemPromptEnabled = options.systemPromptEnabled ?? true;
		this.systemPrompt = options.systemPrompt ?? null;
		this.allowDeletes = options.allowDeletes ?? false;
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
	 * Handle an incoming MCP request. Serves the 2026-07-28 protocol and, statelessly, 2025-era clients.
	 *
	 * OAuth-specific checks (when `accountability.oauth` is set):
	 * - Transport restriction: token must be in Authorization header (RFC 6750), not cookie/query
	 * - Scope check: must include mcp:access
	 * - Audience check: must match the canonical MCP resource URL (PUBLIC_URL/mcp)
	 *
	 * @see sendUnauthorized for WWW-Authenticate format (RFC 9728 `resource_metadata` attribute)
	 */
	async handleRequest(req: Request, res: Response): Promise<void> {
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

		if (req.method !== 'POST') {
			res.set('Allow', 'POST').status(405).send();
			return;
		}

		const handler = createMcpHandler(() => this.createServer(req));

		try {
			await toNodeHandler(handler)(req, res, req.body);
		} finally {
			await handler.close();
		}
	}

	createServer(req: Request): Server {
		const server = new Server(getServerInfo(this.project), {
			capabilities: {
				tools: {},
				prompts: {},
			},
		});

		server.setRequestHandler('prompts/list', async () => {
			if (!this.promptsCollection) return { prompts: [] };

			const service = new ItemsService<Prompt>(this.promptsCollection, {
				accountability: req.accountability,
				schema: req.schema,
			});

			const promptList = await service.readByQuery({
				fields: ['name', 'description', 'system_prompt', 'messages'],
			});

			const prompts = promptList.map((prompt) => {
				const varNames = new Set<string>();

				if (prompt.system_prompt) {
					for (const varName of tokenize(prompt.system_prompt).varNames) varNames.add(varName);
				}

				for (const message of prompt.messages || []) {
					for (const varName of tokenize(message.text).varNames) varNames.add(varName);
				}

				const args: PromptArgument[] = [...varNames].map((varName) => ({
					name: varName,
					description: `Value for ${varName}`,
					required: false,
				}));

				return {
					name: prompt.name,
					description: prompt.description,
					arguments: args,
				};
			});

			return { prompts };
		});

		server.setRequestHandler('prompts/get', async (request) => {
			const { name: promptName, arguments: args } = request.params;

			if (!this.promptsCollection) {
				throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Invalid prompt "${promptName}"`);
			}

			const service = new ItemsService<Prompt>(this.promptsCollection, {
				accountability: req.accountability,
				schema: req.schema,
			});

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
				throw new ProtocolError(ProtocolErrorCode.InvalidParams, `Invalid prompt "${promptName}"`);
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

		const toolMode: McpToolMode = req.query?.['tool_mode'] === 'registry' ? 'registry' : 'legacy';

		server.setRequestHandler('tools/list', () => {
			return {
				tools: (toolMode === 'registry' ? mountedRegistry.getRootTools() : mountedRegistry.tools).map((tool) =>
					this.toMcpTool(tool, toolMode),
				),
			};
		});

		server.setRequestHandler('tools/call', async (request) => {
			try {
				if (toolMode === 'legacy') {
					const tool = ALL_TOOLS.find(({ name }) => name === request.params.name);

					if (!tool || (tool.name === 'system-prompt' && this.systemPromptEnabled === false)) {
						throw new InvalidPayloadError({ reason: `"${request.params.name}" doesn't exist in the toolset` });
					}

					if (req.accountability?.admin !== true && tool.admin === true) {
						throw new ForbiddenError({ reason: 'You must be an admin to access this tool' });
					}
				}

				const result =
					toolMode === 'registry'
						? await mountedRegistry.executeRoot(request.params.name, request.params.arguments)
						: await mountedRegistry.execute(request.params.name, request.params.arguments);

				return this.toToolResponse(result, toolMode);
			} catch (error) {
				return this.toExecutionError(error);
			}
		});

		return server;
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

	toMcpTool(tool: RootTool, mode: McpToolMode = 'legacy'): Tool {
		return {
			name: tool.name,
			description: mode === 'legacy' && tool.instructions ? tool.instructions : tool.description,
			inputSchema: z.toJSONSchema(tool.inputSchema) as Tool['inputSchema'],
			annotations: tool.annotations,
			...(mode === 'registry' && tool.output && { outputSchema: z.toJSONSchema(tool.output) as Tool['outputSchema'] }),
		};
	}

	toToolResponse(executeResult: RegistryExecuteResult, mode: McpToolMode = 'legacy'): CallToolResult {
		if (!executeResult.ok) {
			return this.toRegistryErrorResponse(executeResult.error, mode);
		}

		return this.toResultResponse(executeResult.result, executeResult.structuredContent, mode);
	}

	toResultResponse(result?: ToolResult, structuredContent?: unknown, mode: McpToolMode = 'legacy'): CallToolResult {
		const response: CallToolResult = {
			content: [],
		};

		if (mode === 'registry' && structuredContent !== undefined) {
			response.structuredContent = structuredContent as CallToolResult['structuredContent'];
		}

		if (!result || typeof result.data === 'undefined' || result.data === null) return response;

		if (result.type === 'text') {
			response.content.push({
				type: 'text',
				text: JSON.stringify(
					mode === 'legacy'
						? { raw: result.data, url: result.url }
						: { data: result.data, ...(result.url && { url: result.url }) },
				),
			});
		} else {
			response.content.push(result);
		}

		return response;
	}

	toRegistryErrorResponse(error: RegistryError, mode: McpToolMode = 'legacy'): CallToolResult {
		const serializedError =
			mode === 'legacy'
				? { error: error.message, ...(error.code !== 'TOOL_EXECUTION_FAILED' && { code: error.code }) }
				: {
						error: error.message,
						code: error.code,
						recoverable: error.recoverable,
						...(error.next && { next: error.next }),
					};

		return {
			isError: true,
			content: [
				{
					type: 'text',
					text: JSON.stringify([serializedError]),
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
