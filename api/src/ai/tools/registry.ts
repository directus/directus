import { useEnv } from '@directus/env';
import { ForbiddenError, InvalidPayloadError, isDirectusError } from '@directus/errors';
import type { Accountability, SchemaOverview } from '@directus/types';
import { isObject, toArray } from '@directus/utils';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { Url } from '../../utils/url.js';
import { defineTool } from './define-tool.js';
import { schema as schemaTool } from './schema/index.js';
import { getToolTypeStrings } from './schema-to-type-string.js';
import { createSearchIndex, type SearchIndex, type ToolSearchResults } from './search-index.js';
import type { ToolConfig, ToolResult } from './types.js';
import { coerceJsonFields } from './utils.js';

export type RegistryErrorCode =
	| 'APPROVAL_REQUIRED'
	| 'FORBIDDEN'
	| 'INVALID_INPUT'
	| 'TOOL_EXECUTION_FAILED'
	| 'UNKNOWN_META_TOOL'
	| 'UNKNOWN_TOOL';

export type RegistryRecoveryNext = {
	tool: string;
	input: Record<string, unknown>;
};

export type RegistryError = {
	code: RegistryErrorCode | string;
	message: string;
	recoverable: boolean;
	next?: RegistryRecoveryNext;
};

export type RegistryExecuteResult =
	| {
			ok: true;
			result?: ToolResult;
			name: string;
			structuredContent?: unknown;
	  }
	| {
			ok: false;
			error: RegistryError;
	  };

export type ToolDetail = {
	name: string;
	description: string;
	instructions?: string;
	inputType: string;
	outputType?: string;
};

export type ToolRegistryMountContext = {
	accountability?: Accountability;
	allowDeletes?: boolean;
	isToolCallApproved?: (options: { args: Record<string, unknown>; tool: ToolConfig<any> }) => boolean;
	schema: SchemaOverview;
	systemPrompt?: string | null;
	systemPromptEnabled?: boolean;
	toolNames?: readonly string[];
};

export type ToolRegistrySearchInput =
	| { query: string; names?: never }
	| { names: [string, ...string[]]; query?: never };

export class ToolRegistry {
	readonly #tools = new Map<string, ToolConfig<any>>();

	constructor(tools: readonly ToolConfig<any>[] = []) {
		for (const tool of tools) {
			this.register(tool);
		}
	}

	register(tool: ToolConfig<any>): void {
		this.#tools.set(tool.name, tool);
	}

	mount(context: ToolRegistryMountContext): MountedToolRegistry {
		return new MountedToolRegistry([...this.#tools.values()], context);
	}
}

export class MountedToolRegistry {
	readonly #context: ToolRegistryMountContext;
	readonly #catalog: Map<string, ToolConfig<any>>;
	#searchIndex: SearchIndex | undefined;

	constructor(tools: readonly ToolConfig<any>[], context: ToolRegistryMountContext) {
		this.#context = context;
		this.#catalog = new Map(tools.map((tool) => [tool.name, tool]));
	}

	get tools(): ToolConfig<any>[] {
		return this.#getVisibleTools();
	}

	search(query: string): ToolSearchResults {
		this.#searchIndex ??= createSearchIndex(this.#getVisibleTools().filter((tool) => tool.exposure !== 'root'));

		return this.#searchIndex.search(query);
	}

	detail(names: readonly string[]): ToolDetail[] {
		return names.flatMap((name) => {
			const tool = this.#getVisibleTool(name);

			if (!tool || tool.exposure === 'root') return [];

			const detail = this.#toDetail(tool);

			return [detail];
		});
	}

	getRootTools(): ToolConfig<any>[] {
		const rootTools = [createSearchTool(this), createExecuteTool(this)];
		const mountedSchemaTool = this.#getVisibleTool(schemaTool.name);

		if (mountedSchemaTool) {
			rootTools.push(mountedSchemaTool);
		}

		return rootTools.map((tool) => withDerivedAnnotations(tool));
	}

	async executeRoot(name: string, input: unknown): Promise<RegistryExecuteResult> {
		const tool = this.getRootTools().find((tool) => tool.name === name);

		if (!tool) {
			return {
				ok: false,
				error: {
					code: 'UNKNOWN_META_TOOL',
					message: `"${name}" doesn't exist in the root toolset`,
					recoverable: false,
				},
			};
		}

		try {
			if (tool.name === 'execute') {
				const args = this.#parseInput(tool, input) as z.infer<typeof ExecuteInputSchema>;

				return await this.execute(args.name, args.input);
			}

			return this.#executeTool(tool, input);
		} catch (error) {
			return {
				ok: false,
				error: toRegistryError(error),
			};
		}
	}

	async execute(name: string, input: unknown): Promise<RegistryExecuteResult> {
		const tool = this.#getVisibleTool(name);

		if (!tool) {
			return {
				ok: false,
				error: {
					code: 'UNKNOWN_TOOL',
					message: `"${name}" doesn't exist in the toolset`,
					recoverable: true,
					next: {
						tool: 'search',
						input: { query: name },
					},
				},
			};
		}

		return this.#executeTool(tool, input);
	}

	isCallReadOnly(name: string, input: unknown): boolean {
		const tool = this.#getVisibleTool(name);

		if (!tool) return true;

		try {
			const args = this.#parseInput(tool, input);

			return this.#isReadOnly(tool, args);
		} catch {
			return true;
		}
	}

	async #executeTool(tool: ToolConfig<any>, input: unknown): Promise<RegistryExecuteResult> {
		try {
			const args = this.#parseInput(tool, input);

			if (this.#context.allowDeletes === false && args['action'] === 'delete') {
				throw new InvalidPayloadError({ reason: 'Delete actions are disabled' });
			}

			if (
				tool.name !== 'execute' &&
				!this.#isReadOnly(tool, args) &&
				this.#context.isToolCallApproved?.({ tool, args }) !== true
			) {
				return {
					ok: false,
					error: {
						code: 'APPROVAL_REQUIRED',
						message: `"${tool.name}" requires approval before execution`,
						recoverable: true,
					},
				};
			}

			const result = await tool.handler({
				args,
				schema: this.#context.schema,
				accountability: this.#context.accountability,
			});

			this.#addUrl(tool, args, result);

			return {
				ok: true,
				name: tool.name,
				...(result && { result }),
				...(tool.output && result?.type === 'text' ? { structuredContent: { data: result.data } } : {}),
			};
		} catch (error) {
			return {
				ok: false,
				error: toRegistryError(error, tool),
			};
		}
	}

	#getVisibleTools(): ToolConfig<any>[] {
		return [...this.#catalog.values()].filter((tool) => this.#isToolVisible(tool));
	}

	#getVisibleTool(name: string): ToolConfig<any> | undefined {
		const tool = this.#catalog.get(name);

		return tool && this.#isToolVisible(tool) ? tool : undefined;
	}

	#isToolVisible(tool: ToolConfig<any>): boolean {
		const allowedNames = this.#context.toolNames ? new Set(this.#context.toolNames) : null;

		if (allowedNames && !allowedNames.has(tool.name) && tool.exposure !== 'root') return false;
		if (this.#context.accountability?.admin !== true && tool.admin === true) return false;
		if (tool.name === 'system-prompt' && this.#context.systemPromptEnabled === false) return false;

		return true;
	}

	#parseInput(tool: ToolConfig<any>, input: unknown): Record<string, unknown> {
		const rawInput = tool.name === 'system-prompt' ? { promptOverride: this.#context.systemPrompt } : input;

		if (!isObject(rawInput)) {
			throw new InvalidPayloadError({ reason: '"arguments" must be an object' });
		}

		const coercedArgs = coerceJsonFields(rawInput as Record<string, unknown>);
		const { error, data: args } = tool.validateSchema?.safeParse(coercedArgs) ?? { data: coercedArgs };

		if (error) {
			throw new InvalidPayloadError({ reason: fromZodError(error).message });
		}

		if (!isObject(args)) {
			throw new InvalidPayloadError({ reason: '"arguments" must be an object' });
		}

		return args as Record<string, unknown>;
	}

	#isReadOnly(tool: ToolConfig<any>, args: Record<string, unknown>): boolean {
		if (tool.readOnly === true) return true;
		if (typeof tool.readOnly === 'function') return tool.readOnly(args);

		return false;
	}

	#addUrl(tool: ToolConfig<any>, args: Record<string, unknown>, result: ToolResult | undefined): void {
		if (!('action' in args) || !['create', 'update', 'read', 'import'].includes(args['action'] as string)) return;
		if (!result?.data) return;

		const data = toArray(result.data);

		if (data.length !== 1) return;

		result.url = buildURL(tool, args, data[0]);
	}

	#toDetail(tool: ToolConfig<any>): ToolDetail {
		const typeStrings = getToolTypeStrings(tool);

		return {
			name: tool.name,
			description: tool.description,
			...typeStrings,
			...(tool.instructions && { instructions: tool.instructions }),
		};
	}
}

const SearchInputSchema = z.object({
	query: z
		.union([z.string(), z.null()])
		.describe('Search query. Use query mode by omitting names. Omit or send null when loading names.')
		.optional(),
	names: z
		.array(z.string())
		.describe('Tool names to load details for. Batch all selected names in one call. Omit when using query.')
		.optional(),
});

const SearchValidateSchema: z.ZodType<ToolRegistrySearchInput> = SearchInputSchema.transform((input, ctx) => {
	const query = input.query?.trim();
	const names = input.names?.map((name) => name.trim()).filter((name) => name.length > 0) ?? [];
	const hasQuery = query !== undefined && query.length > 0;
	const hasNames = names.length > 0;

	if ((hasQuery ? 1 : 0) + (hasNames ? 1 : 0) !== 1) {
		ctx.addIssue({
			code: 'custom',
			message: 'Provide exactly one of "query" or "names"',
		});

		return z.NEVER;
	}

	if (hasQuery) {
		return { query };
	}

	return { names: names as [string, ...string[]] };
});

const ExecuteInputSchema = z.object({
	name: z.string(),
	input: z.record(z.string(), z.unknown()).default({}),
});

export function createSearchTool(registry: MountedToolRegistry): ToolConfig<ToolRegistrySearchInput> {
	return defineTool({
		name: 'search',
		description:
			'Searches available Directus tools. Use query for discovery. Use names to load full details for selected tools before execute. Batch all selected names in one names array. Never send both query and names.',
		inputSchema: SearchInputSchema,
		validateSchema: SearchValidateSchema,
		readOnly: true,
		exposure: 'root',
		handler: async ({ args }) => ({
			type: 'text',
			data: args.query !== undefined ? registry.search(args.query) : { results: registry.detail(args.names ?? []) },
		}),
	});
}

export function createExecuteTool(registry: MountedToolRegistry): ToolConfig<z.infer<typeof ExecuteInputSchema>> {
	return defineTool({
		name: 'execute',
		description:
			'Executes a Directus tool after its details were loaded with search({ names }). The name must be an inner tool name like "collections", "fields", or "relations", never a root tool name like "search" or "execute". If the result includes next, call that tool with that input and retry.',
		inputSchema: ExecuteInputSchema,
		validateSchema: ExecuteInputSchema,
		readOnly: (args) => registry.isCallReadOnly(args.name, args.input),
		exposure: 'root',
		annotations: {
			openWorldHint: true,
		},
		handler: async ({ args }) => ({
			type: 'text',
			data: await registry.execute(args.name, args.input),
		}),
	});
}

function withDerivedAnnotations<T extends ToolConfig<any>>(tool: T): T {
	return {
		...tool,
		annotations: {
			...tool.annotations,
			...getReadOnlyAnnotations(tool),
		},
	};
}

function getReadOnlyAnnotations(tool: ToolConfig<any>): ToolConfig<any>['annotations'] {
	if (tool.name === 'execute') {
		return {
			readOnlyHint: false,
			destructiveHint: true,
			openWorldHint: true,
		};
	}

	if (tool.readOnly === true) {
		return {
			readOnlyHint: true,
			destructiveHint: false,
		};
	}

	return {
		readOnlyHint: false,
		destructiveHint: true,
	};
}

function buildURL(tool: ToolConfig<any>, input: unknown, data: unknown): string | undefined {
	const env = useEnv();
	const publicURL = env['PUBLIC_URL'] as string | undefined;

	if (!publicURL || !tool.endpoint) return;

	const path = tool.endpoint({ input, data });

	if (!path) return;

	return new Url(publicURL).addPath('admin', ...path).toString();
}

function toRegistryError(error: unknown, tool?: ToolConfig<any>): RegistryError {
	if (isDirectusError(error)) {
		return {
			code: error.code,
			message: error.message || 'Unknown error',
			recoverable: error instanceof InvalidPayloadError,
			...(error instanceof InvalidPayloadError && tool?.exposure !== 'root'
				? {
						next: {
							tool: 'search',
							input: { names: [tool.name] },
						},
					}
				: {}),
		};
	}

	if (error instanceof ForbiddenError) {
		return {
			code: 'FORBIDDEN',
			message: error.message || 'Forbidden',
			recoverable: false,
		};
	}

	if (error instanceof Error) {
		return {
			code: 'TOOL_EXECUTION_FAILED',
			message: error.message,
			recoverable: false,
		};
	}

	return {
		code: 'TOOL_EXECUTION_FAILED',
		message: 'An unknown error occurred.',
		recoverable: false,
	};
}
