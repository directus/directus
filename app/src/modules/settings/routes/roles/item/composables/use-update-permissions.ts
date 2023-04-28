import api from '@/api';
import { Permission, Collection } from '@directus/types';
import { unexpectedError } from '@/utils/unexpected-error';
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

export default function useUpdatePermissions(
	collection: Ref<Collection>,
	permissions: Ref<Permission[]>,
	role: Ref<string>
): UsableUpdatePermissions {
	const saving = ref(false);
	const refresh = inject<() => Promise<void>>('refresh-permissions');

	return { getPermission, setFullAccess, setNoAccess, setFullAccessAll, setNoAccessAll };

	function getPermission(action: string) {
		return permissions.value.find((permission) => permission.action === action);
	}

	async function setFullAccess(action: Action) {
		if (saving.value === true) return;

		saving.value = true;

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
			} catch (err: any) {
				unexpectedError(err);
			} finally {
				await refresh?.();
				saving.value = false;
			}
		} else {
			try {
				await api.post('/permissions/', {
					role: role.value,
					collection: collection.value.collection,
					action: action,
					fields: '*',
					permissions: {},
					validation: {},
				});
			} catch (err: any) {
				unexpectedError(err);
			} finally {
				await refresh?.();
				saving.value = false;
			}
		}
	}

	async function setNoAccess(action: Action) {
		if (saving.value === true) return;

		const permission = getPermission(action);

		if (!permission) return;

		saving.value = true;

		try {
			await api.delete(`/permissions/${permission.id}`);
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			await refresh?.();
			saving.value = false;
		}
	}

	async function setFullAccessAll() {
		if (saving.value === true) return;

		saving.value = true;

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
					} catch (err: any) {
						unexpectedError(err);
					}
				} else {
					try {
						await api.post('/permissions/', {
							role: role.value,
							collection: collection.value.collection,
							action: action,
							fields: '*',
							permissions: {},
							validation: {},
						});
					} catch (err: any) {
						unexpectedError(err);
					}
				}
			})
		);

		await refresh?.();
		saving.value = false;
	}

	async function setNoAccessAll() {
		if (saving.value === true) return;

		saving.value = true;

		try {
			await api.delete('/permissions', { data: permissions.value.map((p) => p.id) });
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			await refresh?.();
			saving.value = false;
		}
	}
}
