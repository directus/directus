import type { Accountability, SchemaOverview } from '@directus/types';
import { describe, expect, test, vi } from 'vitest';
import prompts from './prompts/index.js';
import { system } from './system.js';

vi.mock('../tool.js', () => ({
	defineTool: vi.fn((config) => config),
}));

describe('system tool', () => {
	describe('prompt override', () => {
		const mockSchema = { collections: {}, fields: {}, relations: {} } as unknown as SchemaOverview;
		const mockAccountability = { user: 'test-user' } as Accountability;
		const mockSanitizedQuery = { fields: ['*'] };

		test.each([undefined, null])('should return default prompt when no override provided', async (override) => {
			const result = await system.handler({
				args: { promptOverride: override },
				schema: mockSchema,
				accountability: mockAccountability,
				sanitizedQuery: mockSanitizedQuery,
			});

			expect(result).toEqual({ type: 'text', data: prompts.systemPrompt });
		});

		test('should return custom prompt when provided', async () => {
			const promptOverride = 'Lorem';

			const result = await system.handler({
				args: { promptOverride },
				schema: mockSchema,
				accountability: mockAccountability,
				sanitizedQuery: mockSanitizedQuery,
			});

			expect(result).toEqual({ type: 'text', data: promptOverride });
		});
	});

	describe('tool configuration', () => {
		test('should have correct tool name', () => {
			expect(system.name).toBe('system-prompt');
		});

		test('should not be admin tool', () => {
			expect(system.admin).toBeUndefined();
		});

		test('should have description', () => {
			expect(system.description).toBeDefined();
		});

		test('should have input and validation schemas', () => {
			expect(system.inputSchema).toBeDefined();
			expect(system.validateSchema).toBeDefined();
		});
	});
});
