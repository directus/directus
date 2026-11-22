import type { Item, PrimaryKey } from '@directus/types';
import { describe, expect, it } from 'vitest';
import { computed, nextTick, ref, watch } from 'vue';

describe('useResolvePrimaryKey', () => {
	function setupResolvePrimaryKey(initial: {
		collection: string;
		primaryKey: string | null;
		isSingleton: boolean;
		pkFieldName?: string;
		initialItem?: Item | null;
	}) {
		const collection = ref(initial.collection);
		const primaryKeyParam = ref<string | null>(initial.primaryKey);
		const isSingleton = ref(initial.isSingleton);
		const primaryKeyField = ref({ field: initial.pkFieldName ?? 'id' });
		const item = ref<Item | null>(initial.initialItem ?? null);

		const resolvedPrimaryKey = ref<PrimaryKey | null>(primaryKeyParam.value);
		const existingPrimaryKey = computed(() => (resolvedPrimaryKey.value === '+' ? null : resolvedPrimaryKey.value));

		watch(
			collection,
			() => {
				resolvedPrimaryKey.value = primaryKeyParam.value;
			},
			{ flush: 'sync' },
		);

		function resolvePrimaryKey(newItem: Item | null, newIsSingleton: boolean, newPrimaryKeyParam: PrimaryKey | null) {
			if (newIsSingleton) {
				if (!newItem) {
					resolvedPrimaryKey.value = null;
					return;
				}

				const pkField = primaryKeyField.value?.field;
				resolvedPrimaryKey.value = (pkField ? (newItem[pkField] ?? '+') : '+') as PrimaryKey;
				return;
			}

			resolvedPrimaryKey.value = newPrimaryKeyParam;
		}

		watch(
			[item, isSingleton, primaryKeyParam],
			([newItem, newIsSingleton, newPKParam]) => resolvePrimaryKey(newItem, newIsSingleton, newPKParam),
			{ immediate: true },
		);

		return {
			collection,
			primaryKeyParam,
			isSingleton,
			primaryKeyField,
			item,
			resolvedPrimaryKey,
			existingPrimaryKey,
		};
	}

	it('should not leak previous UUID when navigating to an integer singleton during loading', async () => {
		const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

		const state = setupResolvePrimaryKey({
			collection: 'articles',
			primaryKey: uuid,
			isSingleton: false,
			initialItem: { id: uuid, title: 'Article' },
		});

		expect(state.resolvedPrimaryKey.value).toBe(uuid);
		expect(state.existingPrimaryKey.value).toBe(uuid);

		// Navigate to singleton collection: collection changes, primaryKeyParam becomes null, item resets to null
		state.collection.value = 'site_settings';
		state.primaryKeyParam.value = null;
		state.isSingleton.value = true;
		state.item.value = null;

		await nextTick();

		// While singleton is loading, resolvedPrimaryKey must be null and not retain previous UUID
		expect(state.resolvedPrimaryKey.value).toBeNull();
		expect(state.existingPrimaryKey.value).toBeNull();

		// Singleton item finishes loading from API with integer ID
		state.item.value = { id: 1, site_name: 'Directus' };

		await nextTick();

		expect(state.resolvedPrimaryKey.value).toBe(1);
		expect(state.existingPrimaryKey.value).toBe(1);
	});

	it('should resolve to + for pristine singletons with { id: null }', async () => {
		const uuid = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

		const state = setupResolvePrimaryKey({
			collection: 'posts',
			primaryKey: uuid,
			isSingleton: false,
			initialItem: { id: uuid },
		});

		// Navigate to uncreated singleton
		state.collection.value = 'empty_singleton';
		state.primaryKeyParam.value = null;
		state.isSingleton.value = true;
		state.item.value = null;

		await nextTick();
		expect(state.resolvedPrimaryKey.value).toBeNull();

		// After fetch, uncreated singleton responds with { id: null }
		state.item.value = { id: null };

		await nextTick();
		expect(state.resolvedPrimaryKey.value).toBe('+');
		expect(state.existingPrimaryKey.value).toBeNull();
	});

	it('should resolve correctly when navigating from singleton to regular collection item', async () => {
		const state = setupResolvePrimaryKey({
			collection: 'site_settings',
			primaryKey: null,
			isSingleton: true,
			initialItem: { id: 1 },
		});

		expect(state.resolvedPrimaryKey.value).toBe(1);

		// Navigate to regular item
		const newUuid = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
		state.collection.value = 'articles';
		state.primaryKeyParam.value = newUuid;
		state.isSingleton.value = false;
		state.item.value = { id: newUuid };

		await nextTick();
		expect(state.resolvedPrimaryKey.value).toBe(newUuid);
		expect(state.existingPrimaryKey.value).toBe(newUuid);
	});
});
