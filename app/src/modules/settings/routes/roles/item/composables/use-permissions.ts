import { ref, Ref, watch } from '@vue/composition-api';
import api from '@/api';
import { Permission } from '@/types';

export default function usePermissions(role: Ref<number>): Record<string, any> {
	const loading = ref(false);
	const error = ref(null);
	const permissions = ref<Permission[] | null>(null);

	watch(role, (newRole, oldRole) => {
		if (newRole !== oldRole) {
			reset();
			fetchPermissions();
		}
	});

	return { loading, error, permissions, fetchPermissions, savePermission, saveAll };

	function reset() {
		loading.value = false;
		error.value = null;
		permissions.value = null;
	}

	async function fetchPermissions() {
		loading.value = true;

		try {
			const response = await api.get(`/permissions`, {
				params: {
					'filter[role][_eq]': role.value,
				},
			});

			permissions.value = response.data.data;
		} catch (err) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}

	async function savePermission(updates: Partial<Permission>) {
		try {
			if (updates.id !== undefined) {
				await api.patch(`/permissions/${updates.id}`, {
					...updates,
				});
			} else {
				await api.post(`/permissions`, updates);
			}

			await fetchPermissions();
		} catch (err) {
			error.value = err;
		}
	}

	async function saveAll(create: Partial<Permission>[], update: Partial<Permission>[]) {
		try {
			if (create.length > 0) {
				await api.post(`/permissions`, create);
			}

			if (update.length > 0) {
				await api.patch(`/permissions`, update);
			}

			await fetchPermissions();
		} catch (err) {
			error.value = err;
		}
	}
}
