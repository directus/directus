import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import { Role } from '@directus/types';
import { ref, Ref } from 'vue';

let roles: Ref<BasicRole[] | null> | null = null;
let loading: Ref<boolean> | null = null;

export type BasicRole = Pick<Role, 'id' | 'name' | 'icon' | 'admin_access'>;

export default function useNavigation(): { roles: Ref<BasicRole[] | null>; loading: Ref<boolean> } {
	if (roles === null) {
		roles = ref<BasicRole[] | null>(null);
	}

	if (loading === null) {
		loading = ref(false);
	}

	if (loading?.value === false) {
		fetchRoles();
	}

	return { roles, loading };

	async function fetchRoles() {
		if (!loading || !roles) return;
		if (!roles.value) loading.value = true;

		try {
			const rolesResponse = await api.get(`/roles`, {
				params: {
					sort: 'name',
					fields: ['id', 'name', 'icon', 'admin_access'],
				},
			});

			roles.value = rolesResponse.data.data;
		} catch (error) {
			unexpectedError(error);
		} finally {
			loading.value = false;
		}
	}
}
