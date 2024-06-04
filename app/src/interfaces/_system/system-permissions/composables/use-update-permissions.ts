import { Collection } from '@directus/types';
import { unexpectedError } from '@/utils/unexpected-error';
import { useApi } from '@directus/composables';
import { Permission } from '@directus/types';
import { isNil } from 'lodash';
import { inject, ref, Ref } from 'vue';

const ACTIONS = ['create', 'read', 'update', 'delete', 'share'] as const;
type Action = (typeof ACTIONS)[number];

type UsableUpdatePermissions = {
	getPermission: (action: string) => Permission | undefined;
	setFullAccess: (action: Action) => Promise<void>;
	setNoAccess: (action: Action) => Promise<void>;
	setFullAccessAll: () => Promise<void>;
	setNoAccessAll: () => Promise<void>;
};

export function useUpdatePermissions(
	collection: Ref<Collection>,
	permissions: Ref<Permission[]>,
	policy: Ref<string | null>,
): UsableUpdatePermissions {
	const api = useApi();
	const saving = ref(false);
	const refresh = inject<() => Promise<void>>('refresh-permissions');

	return { getPermission, setFullAccess, setNoAccess, setFullAccessAll, setNoAccessAll };

	function getPermission(action: string) {
		return permissions.value.find((permission) => permission.action === action);
	}

	async function setFullAccess(action: Action) {
		if (saving.value === true) return;

		saving.value = true;

		// TODO do we still want this behavior?
		// If this collection isn't "managed" yet, make sure to add it to directus_collections first
		// before trying to associate any permissions with it
		if (collection.value.meta === null) {
			await api.patch(`/collections/${collection.value.collection}`, {
				meta: {},
			});
		}

		const permission = getPermission(action);

		if (permission) {
			try {
				await api.patch(`/permissions/${permission.id}`, {
					fields: '*',
					permissions: {},
					validation: {},
				});
			} catch (error) {
				unexpectedError(error);
			} finally {
				await refresh?.();
				saving.value = false;
			}
		} else {
			try {
				await api.post('/permissions/', {
					policy: policy.value,
					collection: collection.value.collection,
					action: action,
					fields: '*',
					permissions: {},
					validation: {},
				});
			} catch (error) {
				unexpectedError(error);
			} finally {
				await refresh?.();
				saving.value = false;
			}
		}
	}

	async function setNoAccess(action: Action) {
		if (saving.value === true) return;

		const permission = getPermission(action);

		if (!permission?.id) return;

		saving.value = true;

		try {
			await api.delete(`/permissions/${permission.id}`);
		} catch (error) {
			unexpectedError(error);
		} finally {
			await refresh?.();
			saving.value = false;
		}
	}

	async function setFullAccessAll() {
		if (saving.value === true) return;

		saving.value = true;

		// TODO do we still want this behavior?
		// If this collection isn't "managed" yet, make sure to add it to directus_collections first
		// before trying to associate any permissions with it
		if (collection.value.meta === null) {
			await api.patch(`/collections/${collection.value.collection}`, {
				meta: {},
			});
		}

		await Promise.all(
			ACTIONS.map(async (action) => {
				const permission = getPermission(action);

				if (permission) {
					try {
						await api.patch(`/permissions/${permission.id}`, {
							fields: '*',
							permissions: {},
							validation: {},
						});
					} catch (error) {
						unexpectedError(error);
					}
				} else {
					try {
						await api.post('/permissions/', {
							policy: policy.value,
							collection: collection.value.collection,
							action: action,
							fields: '*',
							permissions: {},
							validation: {},
						});
					} catch (error) {
						unexpectedError(error);
					}
				}
			}),
		);

		await refresh?.();
		saving.value = false;
	}

	async function setNoAccessAll() {
		if (saving.value === true) return;

		saving.value = true;

		try {
			await api.delete('/permissions', { data: permissions.value.map((p) => p.id).filter((id) => !isNil(id)) });
		} catch (error) {
			unexpectedError(error);
		} finally {
			await refresh?.();
			saving.value = false;
		}
	}
}
