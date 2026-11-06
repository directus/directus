import type { ItemPermissions } from '@directus/types';
import { computed, MaybeRef, ref, unref, watch } from 'vue';
import api from '@/api';
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';
import { unexpectedError } from '@/utils/unexpected-error';

export type PanelPermissions = { update: boolean; delete: boolean };

const ACTIONS = ['update', 'delete'] as const;

/** Permissions on panel level */
export function usePanelPermissions(panelIds: MaybeRef<string[]>, enabled: MaybeRef<boolean>) {
	const userStore = useUserStore();
	const permissionsStore = usePermissionsStore();

	const fetched = ref<Record<string, PanelPermissions>>({});
	let latestRequest = 0;

	// `null` means only the item can decide
	function getCollectionAccess(action: (typeof ACTIONS)[number]) {
		if (userStore.isAdmin) return true;

		const access = permissionsStore.getPermission('directus_panels', action)?.access ?? 'none';

		return access === 'partial' ? null : access === 'full';
	}

	const collectionAccess = computed(() => ({
		update: getCollectionAccess('update'),
		delete: getCollectionAccess('delete'),
	}));

	const shouldFetch = computed(
		() => unref(enabled) && ACTIONS.some((action) => collectionAccess.value[action] === null),
	);

	const persistedIds = computed(() => unref(panelIds).filter((id) => id.startsWith('_') === false));
	const persistedIdsKey = computed(() => persistedIds.value.join(','));

	watch(
		[shouldFetch, persistedIdsKey],
		async ([fetching]) => {
			const request = ++latestRequest;

			if (fetching === false) {
				fetched.value = {};
				return;
			}

			const ids = persistedIds.value;

			const results = await Promise.allSettled(
				ids.map((id) =>
					api.get<{ data: ItemPermissions }>(`/permissions/me/directus_panels/${encodeURIComponent(id)}`),
				),
			);

			if (request !== latestRequest) return;

			const next: Record<string, PanelPermissions> = {};

			results.forEach((result, index) => {
				if (result.status === 'fulfilled') {
					const { update, delete: remove } = result.value.data.data;
					next[ids[index]!] = { update: update.access, delete: remove.access };
				} else {
					// Optimistic in case of errors to not block UI
					next[ids[index]!] = { update: true, delete: true };
				}
			});

			fetched.value = next;

			const failure = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');

			if (failure) unexpectedError(failure.reason);
		},
		{ immediate: true },
	);

	return computed(() => {
		const permissions: Record<string, PanelPermissions> = {};
		const createAllowed = permissionsStore.hasPermission('directus_panels', 'create');

		for (const id of unref(panelIds)) {
			if (id.startsWith('_')) {
				// Staged panels are saved through `create`, deleting one only discards the local edit
				permissions[id] = { update: createAllowed, delete: true };
				continue;
			}

			permissions[id] = {
				update: collectionAccess.value.update ?? fetched.value[id]?.update === true,
				delete: collectionAccess.value.delete ?? fetched.value[id]?.delete === true,
			};
		}

		return permissions;
	});
}
