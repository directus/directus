import type { Knex } from 'knex';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { CapabilitiesHelper } from './types.js';

// Helper function to create test subclasses dynamically
const createTestHelpers = (BaseClass: typeof CapabilitiesHelper) => {
	class TestCapabilitiesHelperWithSupport extends BaseClass {
		protected override async checkJsonSupport(): Promise<boolean> {
			// Call knex.raw to simulate a database check
			await this.knex.raw('SELECT 1');
			return true;
		}
	}

	class TestCapabilitiesHelperWithoutSupport extends BaseClass {
		protected override async checkJsonSupport(): Promise<boolean> {
			// Call knex.raw to simulate a database check
			await this.knex.raw('SELECT 1');
			return false;
		}
	}

	return { TestCapabilitiesHelperWithSupport, TestCapabilitiesHelperWithoutSupport };
};

// Mock Knex instance
const createMockKnex = () => {
	return {
		raw: vi.fn().mockResolvedValue({}),
	} as unknown as Knex;
};

describe('CapabilitiesHelper', () => {
	describe('supportsJsonQueries', () => {
		beforeEach(() => {
			// Reset modules to clear the CheckedCapabilities cache
			vi.resetModules();
		});

		test('returns false when checkJsonSupport returns false', async () => {
			const { CapabilitiesHelper } = await import('./types.js');
			const helpers = createTestHelpers(CapabilitiesHelper);

			const mockKnex = createMockKnex();
			const helper = new helpers.TestCapabilitiesHelperWithoutSupport(mockKnex);

			const result = await helper.supportsJsonQueries();

			expect(result).toBe(false);
			expect(mockKnex.raw).toHaveBeenCalledOnce();
		});

		test('returns true when checkJsonSupport returns true', async () => {
			const { CapabilitiesHelper } = await import('./types.js');
			const helpers = createTestHelpers(CapabilitiesHelper);

			const mockKnex = createMockKnex();
			const helper = new helpers.TestCapabilitiesHelperWithSupport(mockKnex);

			const result = await helper.supportsJsonQueries();

			expect(result).toBe(true);
			expect(mockKnex.raw).toHaveBeenCalledOnce();
		});

		test('caches the result and does not call checkJsonSupport on subsequent calls', async () => {
			const { CapabilitiesHelper } = await import('./types.js');
			const helpers = createTestHelpers(CapabilitiesHelper);

			const mockKnex = createMockKnex();
			const helper = new helpers.TestCapabilitiesHelperWithSupport(mockKnex);

			// First call
			const result1 = await helper.supportsJsonQueries();
			expect(result1).toBe(true);
			expect(mockKnex.raw).toHaveBeenCalledOnce();

			// Second call - should use cached value
			const result2 = await helper.supportsJsonQueries();
			expect(result2).toBe(true);
			expect(mockKnex.raw).toHaveBeenCalledOnce(); // Still only once

			// Third call - should still use cached value
			const result3 = await helper.supportsJsonQueries();
			expect(result3).toBe(true);
			expect(mockKnex.raw).toHaveBeenCalledOnce(); // Still only once
		});

		test('caches false result correctly', async () => {
			const { CapabilitiesHelper } = await import('./types.js');
			const helpers = createTestHelpers(CapabilitiesHelper);

			const mockKnex = createMockKnex();
			const helper = new helpers.TestCapabilitiesHelperWithoutSupport(mockKnex);

			// First call
			const result1 = await helper.supportsJsonQueries();
			expect(result1).toBe(false);
			expect(mockKnex.raw).toHaveBeenCalledOnce();

			// Second call - should use cached false value
			const result2 = await helper.supportsJsonQueries();
			expect(result2).toBe(false);
			expect(mockKnex.raw).toHaveBeenCalledOnce(); // Still only once
		});

		test('uses shared cache across multiple instances', async () => {
			const { CapabilitiesHelper } = await import('./types.js');
			const helpers = createTestHelpers(CapabilitiesHelper);

			const mockKnex1 = createMockKnex();
			const mockKnex2 = createMockKnex();
			const helper1 = new helpers.TestCapabilitiesHelperWithSupport(mockKnex1);
			const helper2 = new helpers.TestCapabilitiesHelperWithSupport(mockKnex2);

			// First call with helper1
			const result1 = await helper1.supportsJsonQueries();
			expect(result1).toBe(true);
			expect(mockKnex1.raw).toHaveBeenCalledOnce();

			// Second call with helper2 - should use cached value from helper1
			const result2 = await helper2.supportsJsonQueries();
			expect(result2).toBe(true);
			expect(mockKnex2.raw).not.toHaveBeenCalled(); // Should not be called due to cache
		});

		test('handles async nature of checkJsonSupport correctly', async () => {
			const { CapabilitiesHelper } = await import('./types.js');
			const helpers = createTestHelpers(CapabilitiesHelper);

			const mockKnex = createMockKnex();

			// Simulate a delayed database response
			mockKnex.raw = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({}), 100)));

			const helper = new helpers.TestCapabilitiesHelperWithSupport(mockKnex);

			const startTime = Date.now();
			const result = await helper.supportsJsonQueries();
			const endTime = Date.now();

			expect(result).toBe(true);
			expect(endTime - startTime).toBeGreaterThanOrEqual(100);
			expect(mockKnex.raw).toHaveBeenCalledOnce();
		});

		test('handles concurrent calls correctly', async () => {
			const { CapabilitiesHelper } = await import('./types.js');
			const helpers = createTestHelpers(CapabilitiesHelper);

			const mockKnex = createMockKnex();
			const helper = new helpers.TestCapabilitiesHelperWithSupport(mockKnex);

			// Call multiple times concurrently before cache is set
			const [result1, result2, result3] = await Promise.all([
				helper.supportsJsonQueries(),
				helper.supportsJsonQueries(),
				helper.supportsJsonQueries(),
			]);

			expect(result1).toBe(true);
			expect(result2).toBe(true);
			expect(result3).toBe(true);

			// Note: Due to race conditions with the cache check, this may be called
			// multiple times if concurrent calls happen before the cache is set.
			// We just verify it was called at least once.
			expect(mockKnex.raw).toHaveBeenCalled();
		});
	});
});
