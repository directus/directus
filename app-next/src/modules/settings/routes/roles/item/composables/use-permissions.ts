import { ref, Ref, watch } from '@vue/composition-api';
import api from '@/api';

export type Permission = {
	id?: number;
	collection: string;
	role: number;
	status: null | string;
	create: 'none' | 'full';
	read: 'none' | 'mine' | 'role' | 'full';
	update: 'none' | 'mine' | 'role' | 'full';
	delete: 'none' | 'mine' | 'role' | 'full';
	comment: 'none' | 'read' | 'create' | 'update' | 'full';
	read_field_blacklist: null | string[];
	write_field_blacklist: null | string[];
	status_blacklist: null | string[];
};

export default function usePermissions(role: Ref<number>) {
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
