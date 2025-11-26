import { ALL_TOOLS } from '@/ai/tools/index.js';
import { InvalidPayloadError } from '@directus/errors';
import { jsonSchema as aiJsonSchema, tool as aiTool } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chatRequestToolToAiSdkTool } from './chat-request-tool-to-ai-sdk-tool.js';

// Mock the AI SDK to capture tool/jsonSchema calls
vi.mock('ai', () => {
	return {
		tool: vi.fn((config: any) => ({ __mock: 'tool', config })),
		jsonSchema: vi.fn((schema: any) => ({ __mock: 'jsonSchema', schema })),
	};
});

// Mock zod-validation-error to provide deterministic messages
vi.mock('zod-validation-error', () => ({
	fromZodError: (err: any) => ({ message: `ZodError: ${err?.message ?? 'invalid'}` }),
}));

// Prepare hoisted mocks so they are available inside vi.mock factories
const { mockValidate, mockHandler } = vi.hoisted(() => ({
	mockValidate: { safeParse: vi.fn((args: any) => ({ data: args })) } as any,
	mockHandler: vi.fn(async (_args: any) => 'handled') as any,
}));

vi.mock('@/ai/tools/index.js', () => {
	const TOOL = {
		name: 'directus.test',
		description: 'A test tool',
		inputSchema: { any: 'flexible' },
		validateSchema: mockValidate,
		handler: mockHandler,
	};

	return { ALL_TOOLS: [TOOL] };
});

const accountability = { user: '123' } as any;
const schema = { collections: {} } as any;

describe('chatRequestToolToAiSdkTool', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// reset defaults
		mockValidate.safeParse = vi.fn((args: any) => ({ data: args }));
		(mockHandler as any).mockResolvedValue('handled');
	});

	it('returns an AI tool for a known string tool name', () => {
		const result: any = chatRequestToolToAiSdkTool({
			chatRequestTool: 'directus.test',
			accountability,
			schema,
		});

		expect(aiTool).toHaveBeenCalledTimes(1);
		const config = (result as any).config;
		expect(config.name).toBe('directus.test');
		expect(config.description).toBe('A test tool');
		expect(config.inputSchema).toEqual((ALL_TOOLS as any)[0].inputSchema);
		expect(typeof config.execute).toBe('function');
	});

	it('calls validateSchema and handler with parsed args, accountability, and schema', async () => {
		(mockValidate.safeParse as any).mockReturnValue({ data: { a: 1 }, error: undefined });
		(mockHandler as any).mockResolvedValue('ok');

		const result: any = chatRequestToolToAiSdkTool({
			chatRequestTool: 'directus.test',
			accountability,
			schema,
		});

		const { execute } = result.config;
		const out = await execute({ a: 1 });

		expect(mockValidate.safeParse).toHaveBeenCalledWith({ a: 1 });
		expect(mockHandler).toHaveBeenCalledWith({ args: { a: 1 }, accountability, schema });
		expect(out).toBe('ok');
	});

	it('throws InvalidPayloadError when validation fails in directus tool execute', async () => {
		(mockValidate.safeParse as any).mockReturnValue({ error: { message: 'bad' } });

		const result: any = chatRequestToolToAiSdkTool({
			chatRequestTool: 'directus.test',
			accountability,
			schema,
		});

		const { execute } = result.config;

		await expect(execute({})).rejects.toBeInstanceOf(InvalidPayloadError);
	});

	it('throws when tool name is unknown', () => {
		// Temporarily empty the tools list for this call
		const original = ALL_TOOLS.splice(0, ALL_TOOLS.length);

		try {
			expect(() =>
				chatRequestToolToAiSdkTool({
					chatRequestTool: 'does.not.exist',
					accountability,
					schema,
				}),
			).toThrowError(/Tool by name "does\.not\.exist" does not exist/);

			expect(() =>
				chatRequestToolToAiSdkTool({
					chatRequestTool: 'does.not.exist',
					accountability,
					schema,
				}),
			).toThrowError(/Tool by name "does\.not\.exist" does not exist/);
		} finally {
			ALL_TOOLS.push(...original);
		}
	});

	it('wraps custom tool object using jsonSchema for its inputSchema', () => {
		const custom = {
			name: 'custom',
			description: 'Custom desc',
			inputSchema: { type: 'object', properties: {} } as any,
		};

		const result: any = chatRequestToolToAiSdkTool({
			chatRequestTool: custom as any,
			accountability,
			schema,
		});

		expect(aiJsonSchema).toHaveBeenCalledWith(custom.inputSchema);
		const config = result.config;
		expect(config.name).toBe('custom');
		expect(config.description).toBe('Custom desc');
		expect(config.inputSchema).toEqual({ __mock: 'jsonSchema', schema: custom.inputSchema });
	});

	it('sets needsApproval to true by default (ask mode)', () => {
		const result: any = chatRequestToolToAiSdkTool({
			chatRequestTool: 'directus.test',
			accountability,
			schema,
		});

		const config = result.config;
		expect(config.needsApproval).toBe(true);
	});

	it('sets needsApproval to false when toolApprovals is always', () => {
		const result: any = chatRequestToolToAiSdkTool({
			chatRequestTool: 'directus.test',
			accountability,
			schema,
			toolApprovals: { 'directus.test': 'always' },
		});

		const config = result.config;
		expect(config.needsApproval).toBe(false);
	});

	it('sets needsApproval to true when toolApprovals is ask', () => {
		const result: any = chatRequestToolToAiSdkTool({
			chatRequestTool: 'directus.test',
			accountability,
			schema,
			toolApprovals: { 'directus.test': 'ask' },
		});

		const config = result.config;
		expect(config.needsApproval).toBe(true);
	});
});
