import { requireText } from '@/utils/require-text.js';
import type { Accountability, SchemaOverview } from '@directus/types';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { system } from './index.js';

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

			expect(result).toEqual({ type: 'text', data: requireText(resolve(__dirname, './prompt.md')) });
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
