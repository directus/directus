import { ref, Ref } from '@vue/composition-api';

import api from '@/api';
import { Role } from '@/types';

let roles: Ref<Role[] | null> | null = null;
let loading: Ref<boolean> | null = null;

export default function useNavigation(): Record<string, Ref> {
	if (roles === null) {
		roles = ref<Role[] | null>(null);
	}

	if (loading === null) {
		loading = ref(false);
	}

	if (roles.value === null && loading?.value === false) {
		fetchRoles();
	}

	return { roles, loading };

	async function fetchRoles() {
		if (!loading || !roles) return;
		loading.value = true;

		const rolesResponse = await api.get(`/roles`, {
			params: {
				sort: 'name',
			},
		});
		roles.value = rolesResponse.data.data;
		loading.value = false;
	}
}
