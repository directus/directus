import { ForbiddenError } from '@directus/errors';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { defineTool } from './define-tool.js';
import { ToolRegistry } from './registry.js';
import type { ToolConfig } from './types.js';

// The registry itself only reads PUBLIC_URL; the remaining keys satisfy import-time
// env access in the service graph pulled in by the schema tool.
vi.mock('@directus/env', () => ({
	useEnv: vi.fn(() => ({
		PUBLIC_URL: 'https://directus.example',
		EMAIL_TEMPLATES_PATH: './templates',
		EXTENSIONS_PATH: './extensions',
	})),
}));

const schema = { collections: {} } as any;

describe('ToolRegistry', () => {
	let readHandler: ReturnType<typeof vi.fn>;
	let writeHandler: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		readHandler = vi.fn(async () => ({ type: 'text', data: [{ id: 1 }] }));
		writeHandler = vi.fn(async () => ({ type: 'text', data: [{ id: 2 }] }));
	});

	test('mount filters chat allowlist from search and execute', async () => {
		const registry = new ToolRegistry([
			createTool({ name: 'allowed', description: 'Allowed search target', handler: readHandler, readOnly: true }),
			createTool({
				name: 'blocked',
				description: 'Blocked search target',
				instructions: 'Blocked instructions',
				handler: readHandler,
				readOnly: true,
			}),
		]);

		const mounted = registry.mount({
			schema,
			toolNames: ['allowed'],
		});

		expect(mounted.search('target').results.map(({ name }) => name)).toEqual(['allowed']);
		expect(mounted.detail(['blocked'])).toEqual([]);

		await expect(mounted.executeRoot('search', { names: ['blocked'] })).resolves.toMatchObject({
			ok: true,
			result: { data: { results: [] } },
		});

		await expect(mounted.execute('blocked', {})).resolves.toMatchObject({
			ok: false,
			error: { code: 'UNKNOWN_TOOL', recoverable: true },
		});
	});

	test('mount excludes admin tools for non-admins', async () => {
		const registry = new ToolRegistry([
			createTool({ name: 'public-tool', description: 'Public search target', handler: readHandler, readOnly: true }),
			createTool({
				name: 'admin-tool',
				description: 'Admin search target',
				handler: readHandler,
				admin: true,
				readOnly: true,
			}),
		]);

		const nonAdmin = registry.mount({
			schema,
			accountability: { admin: false } as any,
		});

		expect(nonAdmin.search('target').results.map(({ name }) => name)).toEqual(['public-tool']);

		await expect(nonAdmin.execute('admin-tool', {})).resolves.toMatchObject({
			ok: false,
			error: { code: 'UNKNOWN_TOOL', recoverable: true },
		});

		const admin = registry.mount({
			schema,
			accountability: { admin: true } as any,
		});

		expect(admin.search('target').results.map(({ name }) => name)).toEqual(
			expect.arrayContaining(['public-tool', 'admin-tool']),
		);

		await expect(admin.execute('admin-tool', {})).resolves.toMatchObject({ ok: true });
	});

	test('executes valid input through coerce, validate, handler, url, and structured payload', async () => {
		const validateSchema = z.object({
			action: z.literal('read'),
			data: z.array(z.object({ name: z.string() })),
		});

		const registry = new ToolRegistry([
			createTool({
				name: 'items',
				description: 'Items',
				inputSchema: validateSchema,
				validateSchema,
				output: z.object({ data: z.array(z.object({ id: z.number() })) }),
				handler: writeHandler,
				readOnly: (input) => input.action === 'read',
				endpoint: () => ['content', 'posts', '2'],
			}),
		]);

		const mounted = registry.mount({ schema, isToolCallApproved: () => false });
		const result = await mounted.execute('items', { action: 'read', data: '[{"name":"Post"}]' });

		expect(writeHandler).toHaveBeenCalledWith({
			args: { action: 'read', data: [{ name: 'Post' }] },
			accountability: undefined,
			schema,
		});

		expect(result).toMatchObject({
			ok: true,
			result: {
				type: 'text',
				data: [{ id: 2 }],
				url: 'https://directus.example/admin/content/posts/2',
			},
			structuredContent: { data: [{ id: 2 }] },
		});
	});

	test('returns recoverable structured errors for invalid input and unknown tools', async () => {
		const registry = new ToolRegistry([
			createTool({
				name: 'validated',
				description: 'Validated',
				validateSchema: z.object({ required: z.string() }),
				handler: readHandler,
				readOnly: true,
			}),
		]);

		const mounted = registry.mount({ schema });

		await expect(mounted.execute('missing', {})).resolves.toMatchObject({
			ok: false,
			error: { code: 'UNKNOWN_TOOL', recoverable: true },
		});

		await expect(mounted.execute('validated', {})).resolves.toMatchObject({
			ok: false,
			error: { code: 'INVALID_PAYLOAD', recoverable: true },
		});

		expect(readHandler).not.toHaveBeenCalled();
	});

	test('shapes forbidden errors without leaking throws', async () => {
		const registry = new ToolRegistry([
			createTool({
				name: 'forbidden',
				description: 'Forbidden',
				handler: async () => {
					throw new ForbiddenError({ reason: 'No access' });
				},
				readOnly: true,
			}),
		]);

		const mounted = registry.mount({ schema });

		await expect(mounted.execute('forbidden', {})).resolves.toMatchObject({
			ok: false,
			error: { code: 'FORBIDDEN', recoverable: false },
		});
	});

	test('consent blocks writes and allows reads', async () => {
		const registry = new ToolRegistry([
			createTool({
				name: 'items',
				description: 'Items',
				validateSchema: z.object({ action: z.enum(['read', 'create']) }),
				handler: writeHandler,
				readOnly: (input) => input.action === 'read',
			}),
		]);

		const mounted = registry.mount({ schema, isToolCallApproved: () => false });

		await expect(mounted.execute('items', { action: 'create' })).resolves.toMatchObject({
			ok: false,
			error: { code: 'APPROVAL_REQUIRED', recoverable: true },
		});

		const readResult = await mounted.execute('items', { action: 'read' });

		expect(readResult).toMatchObject({ ok: true });
		expect(readResult).not.toHaveProperty('structuredContent');
		expect(writeHandler).toHaveBeenCalledTimes(1);

		const approved = registry.mount({ schema, isToolCallApproved: () => true });

		await expect(approved.execute('items', { action: 'create' })).resolves.toMatchObject({ ok: true });
		expect(writeHandler).toHaveBeenCalledTimes(2);
	});

	test('blocks delete actions at execute time', async () => {
		const registry = new ToolRegistry([
			createTool({
				name: 'items',
				description: 'Items',
				validateSchema: z.object({ action: z.literal('delete') }),
				handler: writeHandler,
				readOnly: false,
			}),
		]);

		const mounted = registry.mount({
			schema,
			allowDeletes: false,
			isToolCallApproved: () => true,
		});

		await expect(mounted.execute('items', { action: 'delete' })).resolves.toMatchObject({
			ok: false,
			error: { code: 'INVALID_PAYLOAD', recoverable: true },
		});

		expect(writeHandler).not.toHaveBeenCalled();
	});

	test('search details include instructions but compact search results do not', async () => {
		const registry = new ToolRegistry([
			createTool({
				name: 'items',
				description: 'Reads entries',
				instructions: 'Full item instructions',
				inputSchema: z.object({
					collection: z.string().describe('Collection name'),
				}),
				keywords: ['entries'],
				output: z.object({
					data: z.array(z.object({ id: z.number() })),
				}),
				handler: readHandler,
				readOnly: true,
			}),
			createTool({
				name: 'files',
				description: 'Reads files',
				instructions: 'Full file instructions',
				inputSchema: z.object({
					folder: z.string().describe('Folder id').optional(),
				}),
				handler: readHandler,
				readOnly: true,
			}),
		]);

		const mounted = registry.mount({ schema });

		await expect(mounted.executeRoot('search', { query: 'entries' })).resolves.toEqual({
			ok: true,
			result: {
				type: 'text',
				data: {
					results: [
						{
							name: 'items',
							description: 'Reads entries',
						},
					],
				},
			},
		});

		await expect(mounted.executeRoot('search', { names: ['items', 'files'] })).resolves.toEqual({
			ok: true,
			result: {
				type: 'text',
				data: {
					results: [
						{
							name: 'items',
							description: 'Reads entries',
							instructions: 'Full item instructions',
							inputType: expect.any(String),
							outputType: expect.any(String),
						},
						{
							name: 'files',
							description: 'Reads files',
							instructions: 'Full file instructions',
							inputType: expect.any(String),
						},
					],
				},
			},
		});
	});

	test('system prompt respects mount settings and server override', async () => {
		const systemHandler = vi.fn(async () => ({ type: 'text' as const, data: 'System prompt' }));

		const registry = new ToolRegistry([
			createTool({
				name: 'system-prompt',
				description: 'System prompt',
				inputSchema: z.object({}),
				validateSchema: z.object({
					promptOverride: z.union([z.string(), z.null()]).optional(),
				}),
				handler: systemHandler,
				readOnly: true,
			}),
		]);

		const disabled = registry.mount({ schema, systemPromptEnabled: false });

		await expect(disabled.execute('system-prompt', {})).resolves.toMatchObject({
			ok: false,
			error: { code: 'UNKNOWN_TOOL', recoverable: true },
		});

		const mounted = registry.mount({ schema, systemPrompt: 'Pinned prompt' });

		await expect(mounted.execute('system-prompt', { promptOverride: 'client prompt' })).resolves.toMatchObject({
			ok: true,
		});

		expect(systemHandler).toHaveBeenCalledWith({
			args: { promptOverride: 'Pinned prompt' },
			accountability: undefined,
			schema,
		});
	});

	test('execute rechecks a stale mount context at call time', async () => {
		const registry = new ToolRegistry([
			createTool({ name: 'items', description: 'Items search target', handler: readHandler, readOnly: true }),
		]);

		const context = { schema, toolNames: ['items'] };
		const mounted = registry.mount(context);

		expect(mounted.search('target').results.map(({ name }) => name)).toEqual(['items']);
		context.toolNames = [];

		await expect(mounted.execute('items', {})).resolves.toMatchObject({
			ok: false,
			error: { code: 'UNKNOWN_TOOL', recoverable: true },
		});
	});

	test('root tools expose search, execute, and mounted schema under allowlist', async () => {
		const approvalHandler = vi.fn(() => true);

		const registry = new ToolRegistry([
			createTool({
				name: 'items',
				description: 'Items',
				validateSchema: z.object({ action: z.enum(['read', 'create']) }),
				handler: readHandler,
				readOnly: (input) => input.action === 'read',
			}),
			createTool({ name: 'schema', description: 'Schema', handler: readHandler, readOnly: true, exposure: 'root' }),
		]);

		const mounted = registry.mount({ schema, toolNames: ['items'], isToolCallApproved: approvalHandler });
		const rootTools = mounted.getRootTools();

		expect(rootTools.map(({ name }) => name)).toEqual(['search', 'execute', 'schema']);

		expect(rootTools.find((tool) => tool.name === 'execute')?.annotations).toMatchObject({
			readOnlyHint: false,
			destructiveHint: true,
			openWorldHint: true,
		});

		const searchInputSchema = z.toJSONSchema(rootTools.find((tool) => tool.name === 'search')!.inputSchema);

		expect(searchInputSchema).toMatchObject({
			type: 'object',
			additionalProperties: false,
			properties: {
				query: { anyOf: [{ type: 'string' }, { type: 'null' }] },
				names: { type: 'array', items: { type: 'string' } },
			},
		});

		expect(searchInputSchema).not.toHaveProperty('oneOf');
		expect(searchInputSchema).not.toHaveProperty('allOf');
		expect(searchInputSchema).not.toHaveProperty('anyOf');

		expect(rootTools.find((tool) => tool.name === 'schema')?.annotations).toMatchObject({
			readOnlyHint: true,
			destructiveHint: false,
		});

		await expect(mounted.executeRoot('searhc', {})).resolves.toMatchObject({
			ok: false,
			error: { code: 'UNKNOWN_META_TOOL', recoverable: false },
		});

		// Catalog tools without root exposure must stay behind the search → execute funnel.
		await expect(mounted.executeRoot('items', { action: 'read' })).resolves.toMatchObject({
			ok: false,
			error: { code: 'UNKNOWN_META_TOOL', recoverable: false },
		});

		await expect(mounted.executeRoot('execute', { name: 'missing', input: {} })).resolves.toMatchObject({
			ok: false,
			error: { code: 'UNKNOWN_TOOL', recoverable: true },
		});

		const invalidExecuteInput = await mounted.executeRoot('execute', { name: 123 });

		expect(invalidExecuteInput).toMatchObject({
			ok: false,
			error: { code: 'INVALID_PAYLOAD', recoverable: true },
		});

		expect((invalidExecuteInput as { error: object }).error).not.toHaveProperty('next');

		await expect(mounted.executeRoot('search', {})).resolves.toMatchObject({
			ok: false,
			error: { code: 'INVALID_PAYLOAD', recoverable: true },
		});

		await expect(mounted.executeRoot('search', { names: [] })).resolves.toMatchObject({
			ok: false,
			error: { code: 'INVALID_PAYLOAD', recoverable: true },
		});

		await expect(mounted.executeRoot('search', { query: 'items', names: [] })).resolves.toMatchObject({
			ok: true,
			result: {
				data: {
					results: [{ name: 'items', description: 'Items' }],
				},
			},
		});

		await expect(mounted.executeRoot('search', { query: 'items', names: ['items'] })).resolves.toMatchObject({
			ok: false,
			error: { code: 'INVALID_PAYLOAD', recoverable: true },
		});

		await expect(mounted.executeRoot('execute', { name: 'items', input: { action: 'read' } })).resolves.toMatchObject({
			ok: true,
			result: { data: [{ id: 1 }] },
		});

		await expect(mounted.executeRoot('search', { query: null, names: ['items'] })).resolves.toMatchObject({
			ok: true,
			result: {
				data: {
					results: [
						expect.objectContaining({
							name: 'items',
							inputType: expect.any(String),
						}),
					],
				},
			},
		});

		await expect(mounted.executeRoot('execute', { name: 'items', input: {} })).resolves.toMatchObject({
			ok: false,
			error: {
				code: 'INVALID_PAYLOAD',
				recoverable: true,
				next: {
					tool: 'search',
					input: { names: ['items'] },
				},
			},
		});

		await expect(mounted.executeRoot('execute', { name: 'items', input: { action: 'read' } })).resolves.toMatchObject({
			ok: true,
			result: { data: [{ id: 1 }] },
		});

		await expect(mounted.executeRoot('execute', { name: 'items', input: { action: 'create' } })).resolves.toMatchObject(
			{
				ok: true,
				result: { data: [{ id: 1 }] },
			},
		);

		expect(approvalHandler).toHaveBeenCalledTimes(1);

		expect(approvalHandler).toHaveBeenCalledWith({
			tool: expect.objectContaining({ name: 'items' }),
			args: { action: 'create' },
		});
	});
});

function createTool(
	options: Pick<ToolConfig<any>, 'description' | 'handler' | 'name'> &
		Partial<
			Pick<
				ToolConfig<any>,
				| 'admin'
				| 'endpoint'
				| 'exposure'
				| 'inputSchema'
				| 'instructions'
				| 'keywords'
				| 'output'
				| 'readOnly'
				| 'validateSchema'
			>
		>,
): ToolConfig<any> {
	const tool: ToolConfig<any> = {
		name: options.name,
		description: options.description,
		inputSchema: options.inputSchema ?? z.object({}),
		handler: options.handler,
	};

	if (options.admin) tool.admin = options.admin;
	if (options.endpoint) tool.endpoint = options.endpoint;
	if (options.exposure) tool.exposure = options.exposure;
	if (options.instructions) tool.instructions = options.instructions;
	if (options.keywords) tool.keywords = options.keywords;
	if (options.output) tool.output = options.output;
	if (options.readOnly !== undefined) tool.readOnly = options.readOnly;
	if (options.validateSchema) tool.validateSchema = options.validateSchema;

	return defineTool(tool);
}
