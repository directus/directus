import { InvalidPayloadError } from '@directus/errors';
import { jsonSchema as aiJsonSchema } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ALL_TOOLS } from '../../tools/index.js';
import { chatRequestToolsToAiSdkTools, toModelOutput } from './chat-request-tool-to-ai-sdk-tool.js';

// Mock the AI SDK to capture tool/jsonSchema/zodSchema calls
vi.mock('ai', () => {
	return {
		tool: vi.fn((config: any) => ({ __mock: 'tool', config })),
		jsonSchema: vi.fn((schema: any) => ({ __mock: 'jsonSchema', schema })),
		zodSchema: vi.fn((schema: any) => ({ __mock: 'zodSchema', schema })),
	};
});

// Prepare hoisted mocks so they are available inside vi.mock factories
const { mockHandler, mockMount, mockMountedRegistry, mockToolRegistryConstructor, mockValidate } = vi.hoisted(() => ({
	mockValidate: { safeParse: vi.fn((args: any) => ({ data: args })) } as any,
	mockHandler: vi.fn(async (_args: any) => 'handled') as any,
	mockMount: vi.fn(),
	mockMountedRegistry: {
		executeRoot: vi.fn(),
		getRootTools: vi.fn(),
		isCallReadOnly: vi.fn(),
	},
	mockToolRegistryConstructor: vi.fn(),
}));

vi.mock('../../tools/index.js', () => {
	const TOOL = {
		name: 'directus.test',
		description: 'A test tool',
		inputSchema: { any: 'flexible' },
		validateSchema: mockValidate,
		handler: mockHandler,
	};

	return {
		ALL_TOOLS: [TOOL],
		ToolRegistry: class {
			constructor(tools: unknown[]) {
				mockToolRegistryConstructor(tools);
			}

			mount(context: unknown) {
				mockMount(context);

				return mockMountedRegistry;
			}
		},
	};
});

const accountability = { user: '123' } as any;
const schema = { collections: {} } as any;

describe('chat request tool mapping', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// reset defaults
		mockValidate.safeParse = vi.fn((args: any) => ({ data: args }));
		(mockHandler as any).mockResolvedValue('handled');

		mockMountedRegistry.getRootTools.mockReturnValue([
			{
				name: 'search',
				description: 'Search tools',
				inputSchema: { root: 'search' },
				readOnly: true,
			},
			{
				name: 'execute',
				description: 'Execute tools',
				inputSchema: { root: 'execute' },
				readOnly: vi.fn(),
			},
			{
				name: 'schema',
				description: 'Read schema',
				inputSchema: { root: 'schema' },
				readOnly: true,
			},
		]);

		mockMountedRegistry.executeRoot.mockResolvedValue({
			ok: true,
			result: { type: 'text', data: { ok: true } },
		});

		mockMountedRegistry.isCallReadOnly.mockReturnValue(false);
	});

	it('returns registry root tools by default and uses string tools as the mounted allowlist', async () => {
		const result: any = chatRequestToolsToAiSdkTools({
			chatRequestTools: ['directus.test'],
			accountability,
			schema,
			systemPrompt: 'System',
		});

		expect(mockToolRegistryConstructor).toHaveBeenCalledWith(ALL_TOOLS);

		expect(mockMount).toHaveBeenCalledWith({
			accountability,
			schema,
			systemPrompt: 'System',
			toolNames: ['directus.test'],
			isToolCallApproved: expect.any(Function),
		});

		expect(Object.keys(result)).toEqual(['search', 'execute', 'schema']);

		await expect(result.search.config.execute({ query: 'items' })).resolves.toEqual({ data: { ok: true } });
		expect(mockMountedRegistry.executeRoot).toHaveBeenCalledWith('search', { query: 'items' });
	});

	it('adds client-side tools alongside registry root tools', () => {
		const result: any = chatRequestToolsToAiSdkTools({
			chatRequestTools: [
				'directus.test',
				{
					name: 'client-tool',
					description: 'Client tool',
					inputSchema: { type: 'object' },
				},
			],
			accountability,
			schema,
		});

		expect(Object.keys(result)).toEqual(['search', 'execute', 'schema', 'client-tool']);
		expect(aiJsonSchema).toHaveBeenCalledWith({ type: 'object' });
	});

	it('adds an object type to client-side schemas for provider tool compatibility', () => {
		chatRequestToolsToAiSdkTools({
			chatRequestTools: [
				{
					name: 'client-tool',
					description: 'Client tool',
					inputSchema: {
						properties: {
							query: { type: 'string' },
						},
						required: ['query'],
					},
				},
			],
			accountability,
			schema,
		});

		expect(aiJsonSchema).toHaveBeenCalledWith({
			type: 'object',
			properties: {
				query: { type: 'string' },
			},
			required: ['query'],
		});
	});

	it('rejects client-side schemas that are not object-shaped', () => {
		expect(() =>
			chatRequestToolsToAiSdkTools({
				chatRequestTools: [
					{
						name: 'client-tool',
						description: 'Client tool',
						inputSchema: {
							anyOf: [{ type: 'string' }, { type: 'number' }],
						},
					},
				],
				accountability,
				schema,
			}),
		).toThrow(InvalidPayloadError);
	});

	it('omits disabled direct and client-side tools while keeping pinned root tools', () => {
		const result: any = chatRequestToolsToAiSdkTools({
			chatRequestTools: [
				'directus.test',
				{
					name: 'client-tool',
					description: 'Client tool',
					inputSchema: { type: 'object' },
				},
			],
			accountability,
			schema,
			toolApprovals: { 'directus.test': 'disabled', 'client-tool': 'disabled', schema: 'disabled' },
		});

		expect(mockMount).toHaveBeenCalledWith({
			accountability,
			schema,
			systemPrompt: undefined,
			toolNames: [],
			isToolCallApproved: expect.any(Function),
		});

		expect(Object.keys(result)).toEqual(['search', 'execute', 'schema']);
	});

	it('keeps pinned root tools even when approval settings include them', () => {
		const result = chatRequestToolsToAiSdkTools({
			chatRequestTools: ['directus.test'],
			accountability,
			schema,
			toolApprovals: { execute: 'disabled', schema: 'disabled', search: 'disabled' },
		});

		expect(Object.keys(result)).toEqual(['search', 'execute', 'schema']);
	});

	it('rejects client-side tools that shadow registry root tools', () => {
		expect(() =>
			chatRequestToolsToAiSdkTools({
				chatRequestTools: [
					{
						name: 'execute',
						description: 'Client execute',
						inputSchema: { type: 'object' },
					},
				],
				accountability,
				schema,
			}),
		).toThrow(InvalidPayloadError);
	});

	it('uses dynamic approval for root execute based on the inner tool read-only state', () => {
		const result: any = chatRequestToolsToAiSdkTools({
			chatRequestTools: ['directus.test'],
			accountability,
			schema,
			toolApprovals: { 'directus.test': 'ask', other: 'always' },
		});

		mockMountedRegistry.isCallReadOnly.mockReturnValueOnce(true);
		expect(result.execute.config.needsApproval({ name: 'directus.test', input: { action: 'read' } })).toBe(false);

		mockMountedRegistry.isCallReadOnly.mockReturnValueOnce(false);
		expect(result.execute.config.needsApproval({ name: 'directus.test', input: { action: 'create' } })).toBe(true);

		mockMountedRegistry.isCallReadOnly.mockReturnValueOnce(false);
		expect(result.execute.config.needsApproval({ name: 'other', input: { action: 'create' } })).toBe(false);
	});

	it('does not request approval for disabled indirect execute calls', () => {
		const result: any = chatRequestToolsToAiSdkTools({
			chatRequestTools: ['directus.test'],
			accountability,
			schema,
			toolApprovals: { 'directus.test': 'disabled' },
		});

		mockMountedRegistry.isCallReadOnly.mockReturnValueOnce(false);

		expect(result.execute.config.needsApproval({ name: 'directus.test', input: { action: 'create' } })).toBe(false);
		expect(mockMountedRegistry.isCallReadOnly).not.toHaveBeenCalled();
	});

	it('returns registry errors as model-visible output', async () => {
		mockMountedRegistry.executeRoot.mockResolvedValueOnce({
			ok: false,
			error: { code: 'UNKNOWN_TOOL', message: 'Missing', recoverable: true },
		});

		const result: any = chatRequestToolsToAiSdkTools({
			chatRequestTools: ['directus.test'],
			accountability,
			schema,
		});

		await expect(result.search.config.execute({ query: 'missing' })).resolves.toEqual({
			error: { code: 'UNKNOWN_TOOL', message: 'Missing', recoverable: true },
		});
	});

	it('maps ToolResult envelopes to model output with data and url', () => {
		expect(
			toModelOutput({
				type: 'text',
				data: [{ id: 1 }],
				url: 'https://directus.example/admin/content/posts/1',
			}),
		).toEqual({
			data: [{ id: 1 }],
			url: 'https://directus.example/admin/content/posts/1',
		});
	});
});
