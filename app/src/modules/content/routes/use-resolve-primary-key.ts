import type { Item, PrimaryKey } from '@directus/types';
import { type Ref, computed, ref, watch } from 'vue';

interface UseResolvePrimaryKeyOptions {
	collection: Ref<string>;
	primaryKeyParam: Ref<PrimaryKey | null>;
	primaryKeyField: Ref<{ field: string } | null | undefined>;
}

/**
 * Resolves the active item primary key for both regular collection items and singletons,
 * resetting synchronously on collection change so stale keys do not leak into subsequent queries.
 */
export function useResolvePrimaryKey({ collection, primaryKeyParam, primaryKeyField }: UseResolvePrimaryKeyOptions) {
	/**
	 * Collection Item PK: ID or '+' (new item).
	 * Singleton Item PK: ID or '+' (new item) or `null` (not-yet loaded).
	 */
	const resolvedPrimaryKey = ref<PrimaryKey | null>(primaryKeyParam.value);
	const existingPrimaryKey = computed(() => (resolvedPrimaryKey.value === '+' ? null : resolvedPrimaryKey.value));

	// Reset on collection change to avoid previous singleton's primary key leaking into the next
	// collection's queries.
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
			// Note: After fetching a singleton item, `newItem` will be `{ id: null }` if it hasn't been created yet.

			const pkField = primaryKeyField.value?.field;
			resolvedPrimaryKey.value = (pkField ? (newItem[pkField] ?? '+') : '+') as PrimaryKey;
			return;
		}

		resolvedPrimaryKey.value = newPrimaryKeyParam;
	}

	return {
		resolvedPrimaryKey,
		existingPrimaryKey,
		resolvePrimaryKey,
	};
}
