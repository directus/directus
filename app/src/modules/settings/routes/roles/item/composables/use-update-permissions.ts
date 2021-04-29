import { ref, inject, Ref } from '@vue/composition-api';
import api from '@/api';
import { Collection, Permission } from '@/types';
import { unexpectedError } from '@/utils/unexpected-error';

export default function useUpdatePermissions(
	collection: Ref<Collection>,
	permissions: Ref<Permission[]>,
	role: Ref<string>
): Record<string, any> {
	const saving = ref(false);
	const refresh = inject<() => Promise<void>>('refresh-permissions');

	return { getPermission, setFullAccess, setNoAccess, setFullAccessAll, setNoAccessAll };

	function getPermission(action: string) {
		return permissions.value.find((permission) => permission.action === action);
	}

	async function setFullAccess(action: 'create' | 'read' | 'update' | 'delete') {
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
					permissions: null,
					validation: null,
				});
			} catch (err) {
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
				});
			} catch (err) {
				unexpectedError(err);
			} finally {
				await refresh?.();
				saving.value = false;
			}
		}
	}

	async function setNoAccess(action: 'create' | 'read' | 'update' | 'delete') {
		const permission = getPermission(action);

		if (!permission) return;

		saving.value = true;

		try {
			await api.delete(`/permissions/${permission.id}`);
		} catch (err) {
			unexpectedError(err);
		} finally {
			await refresh?.();
			saving.value = false;
		}
	}

	async function setFullAccessAll() {
		saving.value = true;

		// If this collection isn't "managed" yet, make sure to add it to directus_collections first
		// before trying to associate any permissions with it
		if (collection.value.meta === null) {
			await api.patch(`/collections/${collection.value.collection}`, {
				meta: {},
			});
		}

		const actions = ['create', 'read', 'update', 'delete'];

		await Promise.all(
			actions.map(async (action) => {
				const permission = getPermission(action);
				if (permission) {
					try {
						await api.patch(`/permissions/${permission.id}`, {
							fields: '*',
							permissions: null,
							validation: null,
						});
					} catch (err) {
						unexpectedError(err);
					}
				} else {
					try {
						await api.post('/permissions/', {
							role: role.value,
							collection: collection.value.collection,
							action: action,
							fields: '*',
						});
					} catch (err) {
						unexpectedError(err);
					}
				}
			})
		);

		await refresh?.();
		saving.value = false;
	}

	async function setNoAccessAll() {
		saving.value = true;

		try {
			await api.delete('/permissions', { data: permissions.value.map((p) => p.id) });
		} catch (err) {
			unexpectedError(err);
		} finally {
			await refresh?.();
			saving.value = false;
		}
	}
}
