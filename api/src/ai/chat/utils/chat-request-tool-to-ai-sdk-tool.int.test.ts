import { describe, expect, test, vi } from 'vitest';
import { chatRequestToolsToAiSdkTools } from './chat-request-tool-to-ai-sdk-tool.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn(() => ({
		EMAIL_TEMPLATES_PATH: './templates',
		MAX_PAYLOAD_SIZE: '1mb',
		PUBLIC_URL: 'https://directus.example',
		QUERY_LIMIT_DEFAULT: 100,
	})),
}));

const accountability = { app: true, admin: true, role: null, roles: [], user: 'user-id' } as any;
const schema = { collections: {} } as any;

describe('chatRequestToolsToAiSdkTools integration', () => {
	test('exposes root tools and executes a discovered tool through the registry', async () => {
		const tools = chatRequestToolsToAiSdkTools({
			chatRequestTools: ['system-prompt'],
			accountability,
			schema,
			systemPrompt: 'Test system prompt',
		});

		expect(Object.keys(tools)).toEqual(['search', 'execute', 'schema']);

		expect((tools['search'] as any).inputSchema.jsonSchema).toMatchObject({
			type: 'object',
			properties: {
				query: { anyOf: [{ type: 'string' }, { type: 'null' }] },
				names: { type: 'array', items: { type: 'string' } },
			},
		});

		expect((tools['search'] as any).inputSchema.jsonSchema).not.toHaveProperty('oneOf');
		expect((tools['search'] as any).inputSchema.jsonSchema).not.toHaveProperty('allOf');
		expect((tools['search'] as any).inputSchema.jsonSchema).not.toHaveProperty('anyOf');

		const discoveryOutput = await tools['search']!.execute!({ query: 'system prompt' }, {} as any);

		expect(discoveryOutput).toMatchObject({
			data: {
				results: [
					{
						name: 'system-prompt',
						description: expect.any(String),
					},
				],
			},
		});

		expect((discoveryOutput as any).data.results[0]).not.toHaveProperty('inputType');
		expect((discoveryOutput as any).data.results[0]).not.toHaveProperty('outputType');

		const searchOutput = await tools['search']!.execute!({ names: ['system-prompt'] }, {} as any);

		expect(searchOutput).toMatchObject({
			data: {
				results: [
					{
						name: 'system-prompt',
						inputType: expect.any(String),
					},
				],
			},
		});

		expect((searchOutput as any).data.results[0]).not.toHaveProperty('inputSchema');
		expect((searchOutput as any).data.results[0]).not.toHaveProperty('outputSchema');

		const executeOutput = await tools['execute']!.execute!({ name: 'system-prompt', input: {} }, {} as any);

		expect(executeOutput).toEqual({
			data: 'Test system prompt',
		});
	});

	test('uses real registry read-only checks for execute approval', () => {
		const tools = chatRequestToolsToAiSdkTools({
			chatRequestTools: ['items'],
			accountability,
			schema,
			toolApprovals: { items: 'ask' },
		});

		expect(tools['execute']!.needsApproval!({ name: 'items', input: { action: 'read', collection: 'posts' } })).toBe(
			false,
		);

		expect(
			tools['execute']!.needsApproval!({
				name: 'items',
				input: { action: 'create', collection: 'posts', data: { title: 'Test' } },
			}),
		).toBe(true);
	});

	test('normalizes client tool input schemas for provider compatibility', () => {
		const tools = chatRequestToolsToAiSdkTools({
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

		expect((tools['client-tool'] as any).inputSchema.jsonSchema).toMatchObject({
			type: 'object',
			properties: {
				query: { type: 'string' },
			},
			required: ['query'],
		});
	});
});
