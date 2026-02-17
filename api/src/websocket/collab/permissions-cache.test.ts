import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { PermissionCache } from './permissions-cache.js';

vi.mock('@directus/env', () => ({
	useEnv: () => ({
		WEBSOCKETS_COLLAB_PERMISSIONS_CACHE_CAPACITY: 5,
	}),
}));

const { mockBus } = vi.hoisted(() => {
	return {
		mockBus: {
			subscribe: vi.fn(),
			publish: vi.fn(),
		},
	};
});

vi.mock('../../bus/index.js', () => ({
	useBus: () => mockBus,
}));

describe('PermissionCache', () => {
	let cache: PermissionCache;
	let busHandler: (event: any) => void;

	beforeEach(() => {
		vi.clearAllMocks();
		cache = new PermissionCache(5);
		busHandler = mockBus.subscribe.mock.calls[0]?.[1];
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	const mockAccountability = { user: 'user-1', role: 'role-1' } as any;

	test('initializes and subscribes to bus', () => {
		expect(mockBus.subscribe).toHaveBeenCalledWith('websocket.event', expect.any(Function));
		expect(busHandler).toBeDefined();
	});

	test('set and get value', () => {
		const fields = ['field1'];
		cache.set(mockAccountability, 'posts', '1', 'read', fields);

		const result = cache.get(mockAccountability, 'posts', '1', 'read');
		expect(result).toEqual(fields);
	});

	test('returns undefined for missing key', () => {
		const result = cache.get(mockAccountability, 'posts', '999', 'read');
		expect(result).toBeUndefined();
	});

	test('differentiates keys by user, collection, item, action', () => {
		const user2 = { ...mockAccountability, user: 'user-2' };

		cache.set(mockAccountability, 'posts', '1', 'read', ['A']);
		cache.set(user2, 'posts', '1', 'read', ['B']);
		cache.set(mockAccountability, 'posts', '1', 'update', ['C']);
		cache.set(mockAccountability, 'comments', '1', 'read', ['D']);

		expect(cache.get(mockAccountability, 'posts', '1', 'read')).toEqual(['A']);
		expect(cache.get(user2, 'posts', '1', 'read')).toEqual(['B']);
		expect(cache.get(mockAccountability, 'posts', '1', 'update')).toEqual(['C']);
		expect(cache.get(mockAccountability, 'comments', '1', 'read')).toEqual(['D']);
	});

	test('ttl expires value', async () => {
		vi.useFakeTimers();

		cache.set(mockAccountability, 'posts', '1', 'read', ['field1'], [], 1000);

		expect(cache.get(mockAccountability, 'posts', '1', 'read')).toBeDefined();

		await vi.advanceTimersByTimeAsync(1100);

		expect(cache.get(mockAccountability, 'posts', '1', 'read')).toBeUndefined();
	});

	describe('Invalidation', () => {
		test('item invalidation clears specific item cache', () => {
			cache.set(mockAccountability, 'posts', '1', 'read', ['A']);
			cache.set(mockAccountability, 'posts', '2', 'read', ['B']);

			// Simulate update event for post 1
			busHandler({
				collection: 'posts',
				keys: ['1'],
			});

			expect(cache.get(mockAccountability, 'posts', '1', 'read')).toBeUndefined();
			expect(cache.get(mockAccountability, 'posts', '2', 'read')).toEqual(['B']);
		});

		test('collection invalidation clears all items in collection', () => {
			cache.set(mockAccountability, 'posts', '1', 'read', ['A']);
			cache.set(mockAccountability, 'posts', '2', 'read', ['B']);
			cache.set(mockAccountability, 'comments', '1', 'read', ['C']);

			// Simulate collection invalidation (e.g. slight change affecting whole collection)
			busHandler({ collection: 'posts' });

			expect(cache.get(mockAccountability, 'posts', '1', 'read')).toBeUndefined();
			expect(cache.get(mockAccountability, 'posts', '2', 'read')).toBeUndefined();
			expect(cache.get(mockAccountability, 'comments', '1', 'read')).toBeDefined();
		});

		test('dependency invalidation', () => {
			// Cache post 1 dependent on author 123
			cache.set(mockAccountability, 'posts', '1', 'read', ['A'], ['directus_users:123']);

			// Invalidate author 123
			busHandler({
				collection: 'directus_users',
				keys: ['123'],
			});

			// Should clear post 1
			expect(cache.get(mockAccountability, 'posts', '1', 'read')).toBeUndefined();
		});

		test('collection dependency invalidation', () => {
			// Cache depends on ALL comments
			cache.set(mockAccountability, 'posts', '1', 'read', ['A'], ['comments']);

			// Invalidate comments
			busHandler({ collection: 'comments' });

			expect(cache.get(mockAccountability, 'posts', '1', 'read')).toBeUndefined();
		});

		test('system collection invalidation clears everything', () => {
			cache.set(mockAccountability, 'posts', '1', 'read', ['A']);

			// Invalidate permissions
			busHandler({ collection: 'directus_permissions' });

			expect(cache.get(mockAccountability, 'posts', '1', 'read')).toBeUndefined();
		});

		test('system collection invalidation increments invalidationCount', () => {
			const initial = cache.getInvalidationCount();
			busHandler({ collection: 'directus_permissions' });
			expect(cache.getInvalidationCount()).toBe(initial + 1);
		});

		test('increments invalidationCount', () => {
			const initial = cache.getInvalidationCount();
			busHandler({ collection: 'posts', keys: ['1'] });
			expect(cache.getInvalidationCount()).toBe(initial + 1);
		});

		test('increments invalidationCount for create action', () => {
			const initial = cache.getInvalidationCount();
			busHandler({ collection: 'posts', action: 'create', keys: ['1'] });
			expect(cache.getInvalidationCount()).toBe(initial + 1);
		});

		test('resets invalidationCount before MAX_SAFE_INTEGER', () => {
			(cache as any).invalidationCount = Number.MAX_SAFE_INTEGER - 1;
			busHandler({ collection: 'posts', keys: ['1'] });
			expect(cache.getInvalidationCount()).toBe(1);
		});

		test('wildcard dependency invalidation (no keys provided)', () => {
			// Cache depends on specific user
			cache.set(mockAccountability, 'posts', '1', 'read', ['A'], ['directus_users:123']);

			// Invalidate directus_users without keys (e.g. from Flow)
			busHandler({ collection: 'directus_users' });

			// Should clear posts/1 because it depends on a specific user, and we don't know which one changed
			expect(cache.get(mockAccountability, 'posts', '1', 'read')).toBeUndefined();
		});

		test('specific dependency invalidation does NOT invalidate unrelated specific dependencies', () => {
			// Cache depends on user 123
			cache.set(mockAccountability, 'posts', '1', 'read', ['A'], ['directus_users:123']);
			// Cache depends on user 456
			cache.set(mockAccountability, 'posts', '2', 'read', ['B'], ['directus_users:456']);

			// Invalidate user 456
			busHandler({ collection: 'directus_users', keys: ['456'] });

			// Should clear posts/2
			expect(cache.get(mockAccountability, 'posts', '2', 'read')).toBeUndefined();

			// Should NOT clear posts/1
			expect(cache.get(mockAccountability, 'posts', '1', 'read')).toBeDefined();
		});

		test('collection dependency invalidation cleared by record update', () => {
			cache.set(mockAccountability, 'posts', '1', 'read', ['A'], ['comments']);

			busHandler({ collection: 'comments', keys: ['123'] });

			expect(cache.get(mockAccountability, 'posts', '1', 'read')).toBeUndefined();
		});

		test('deeply nested mapping tags correctly (user update clears user dependency but not others)', () => {
			cache.set(mockAccountability, 'articles', '1', 'read', ['*'], ['directus_users:user-1']);
			const accountB = { ...mockAccountability, user: 'user-2' };
			cache.set(accountB, 'articles', '2', 'read', ['*'], ['directus_users:user-2']);

			busHandler({ collection: 'directus_users', keys: ['user-2'] });

			expect(cache.get(accountB, 'articles', '2', 'read')).toBeUndefined();
			expect(cache.get(mockAccountability, 'articles', '1', 'read')).toBeDefined();
		});

		test('dynamic variable $CURRENT_ROLE invalidation', () => {
			cache.set(mockAccountability, 'posts', '1', 'read', ['*'], ['directus_roles:role-1']);

			busHandler({ collection: 'directus_roles', keys: ['role-1'] });

			expect(cache.get(mockAccountability, 'posts', '1', 'read')).toBeUndefined();
		});

		test('dynamic variable $CURRENT_ROLES invalidation', () => {
			const accMultiRole = { ...mockAccountability, roles: ['role-A', 'role-B'] };
			cache.set(accMultiRole, 'posts', '1', 'read', ['*'], ['directus_roles:role-A', 'directus_roles:role-B']);

			busHandler({ collection: 'directus_roles', keys: ['role-B'] });

			expect(cache.get(accMultiRole, 'posts', '1', 'read')).toBeUndefined();
		});

		test('deeply nested dynamic path invalidation ($CURRENT_USER.dept.team)', () => {
			cache.set(mockAccountability, 'articles', '1', 'read', ['*'], ['directus_users:user-1', 'departments', 'teams']);

			// User update clears it
			expect(cache.get(mockAccountability, 'articles', '1', 'read')).toBeDefined();
			busHandler({ collection: 'directus_users', keys: ['user-1'] });
			expect(cache.get(mockAccountability, 'articles', '1', 'read')).toBeUndefined();

			// Department record update clears it
			cache.set(mockAccountability, 'articles', '1', 'read', ['*'], ['directus_users:user-1', 'departments', 'teams']);
			busHandler({ collection: 'departments', keys: ['dept-123'] });
			expect(cache.get(mockAccountability, 'articles', '1', 'read')).toBeUndefined();
		});
	});

	describe('Security & Edge Cases', () => {
		test('item dependent on multiple sources invalidates if ANY source changes', () => {
			cache.set(mockAccountability, 'posts', '1', 'read', ['A'], ['directus_users:A', 'directus_files:B']);

			// Invalidate User A -> Cache should clear
			busHandler({ collection: 'directus_users', keys: ['A'] });
			expect(cache.get(mockAccountability, 'posts', '1', 'read')).toBeUndefined();

			cache.set(mockAccountability, 'posts', '1', 'read', ['A'], ['directus_users:A', 'directus_files:B']);

			// Invalidate File B -> Cache should clear
			busHandler({ collection: 'directus_files', keys: ['B'] });
			expect(cache.get(mockAccountability, 'posts', '1', 'read')).toBeUndefined();
		});

		test('overlapping dependencies: multiple items depend on same source', () => {
			cache.set(mockAccountability, 'posts', '1', 'read', ['A'], ['directus_users:X']);
			cache.set(mockAccountability, 'posts', '2', 'read', ['B'], ['directus_users:X']);

			busHandler({ collection: 'directus_users', keys: ['X'] });

			expect(cache.get(mockAccountability, 'posts', '1', 'read')).toBeUndefined();
			expect(cache.get(mockAccountability, 'posts', '2', 'read')).toBeUndefined();
		});

		test('handles empty keys array same as missing keys (generic invalidation)', () => {
			cache.set(mockAccountability, 'posts', '1', 'read', ['A'], ['directus_users:X']);

			busHandler({ collection: 'directus_users', keys: [] });

			expect(cache.get(mockAccountability, 'posts', '1', 'read')).toBeUndefined();
		});

		test('system collection invalidation wipes entire cache rigorously', () => {
			cache.set(mockAccountability, 'posts', '1', 'read', ['A']);
			cache.set(mockAccountability, 'comments', '2', 'read', ['B']);
			cache.set(mockAccountability, 'users', '3', 'read', ['C']);

			busHandler({ collection: 'directus_roles' });

			expect(cache.get(mockAccountability, 'posts', '1', 'read')).toBeUndefined();
			expect(cache.get(mockAccountability, 'comments', '2', 'read')).toBeUndefined();
			expect(cache.get(mockAccountability, 'users', '3', 'read')).toBeUndefined();
		});

		test('system collection invalidation ignores keys and wipes everything anyway', () => {
			cache.set(mockAccountability, 'posts', '1', 'read', ['A']);

			busHandler({ collection: 'directus_permissions', keys: ['some-id'] });

			expect(cache.get(mockAccountability, 'posts', '1', 'read')).toBeUndefined();
		});

		test('generic collection invalidation (own collection) with empty keys array clears cache', () => {
			cache.set(mockAccountability, 'posts', '1', 'read', ['A']);

			// Should invalidate all 'posts' items
			busHandler({ collection: 'posts', keys: [] });

			expect(cache.get(mockAccountability, 'posts', '1', 'read')).toBeUndefined();
		});
	});

	describe('LRU Eviction', () => {
		test('evicts oldest item when at capacity', () => {
			// Capacity is 5
			cache.set(mockAccountability, 'posts', '1', 'read', ['1']);
			cache.set(mockAccountability, 'posts', '2', 'read', ['2']);
			cache.set(mockAccountability, 'posts', '3', 'read', ['3']);
			cache.set(mockAccountability, 'posts', '4', 'read', ['4']);
			cache.set(mockAccountability, 'posts', '5', 'read', ['5']);

			// Access 1 to make it fresh
			cache.get(mockAccountability, 'posts', '1', 'read');

			// Add 6th item
			cache.set(mockAccountability, 'posts', '6', 'read', ['6']);

			// 2 should be evicted (oldest unused)
			expect(cache.get(mockAccountability, 'posts', '2', 'read')).toBeUndefined();
			expect(cache.get(mockAccountability, 'posts', '1', 'read')).toBeDefined();
		});
	});
});
