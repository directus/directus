import { describe, expect, test, vi } from 'vitest';

const subscribe = vi.fn();

vi.mock('@directus/env', async () => {
	const { mockEnv } = await import('../../test-utils/env.js');
	return mockEnv();
});

vi.mock('../../bus/index.js', () => ({
	useBus: () => ({ subscribe, publish: vi.fn() }),
}));

/**
 * The per-role/user GraphQL schema cache is built from permissions data, so it MUST be
 * invalidated on permission/policy/access changes as well as structural schema changes.
 * Permission/policy/access mutations broadcast `permissionsChanged` (not `schemaChanged`)
 * to avoid a full schema reload — so this cache must subscribe to both events, otherwise
 * GraphQL would serve stale field-level permissions after a permission change.
 */
describe('GraphQL schema cache invalidation', () => {
	test('subscribes to both schemaChanged and permissionsChanged', async () => {
		await import('./schema-cache.js');
		const events = subscribe.mock.calls.map((c) => c[0]);
		expect(events).toContain('schemaChanged');
		expect(events).toContain('permissionsChanged');
	});

	test('the permissionsChanged handler clears the schema cache', async () => {
		const { cache } = await import('./schema-cache.js');
		const handler = subscribe.mock.calls.find((c) => c[0] === 'permissionsChanged')?.[1];
		expect(handler).toBeTypeOf('function');

		cache.set('some_role_schema_key', 'cached-schema');
		expect(cache.size).toBe(1);

		handler();
		expect(cache.size).toBe(0);
	});
});
