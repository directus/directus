import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import { Role } from '@directus/types';
import { groupBy } from 'lodash';
import { computed, ref, Ref } from 'vue';

let roles: Ref<BasicRole[] | null> | null = null;
let loading: Ref<boolean> | null = null;

export type BasicRole = Pick<Role, 'id' | 'name' | 'icon' | 'parent'> & { children?: BasicRole[] };

const globalOpenRoles = ref<string[]>([]);

// TODO make this work with new r&p
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

	const roleTree = computed(() => {
		if (!roles.value) return [];

		const rolesByParent = groupBy(roles.value, 'parent');

		// TODO this currently does not account for circular roles (which is a thing we want to avoid anyways)
		return rolesByParent[null]?.map(buildTree);

		function buildTree(role: BasicRole) {
			const children = rolesByParent[role.id];

			if (!children) return role;

			return {
				...role,
				children: children.map(buildTree),
			};
		}
	});

	return { roles, roleTree, openRoles: globalOpenRoles, loading };

	async function fetchRoles() {
		if (!loading || !roles) return;
		if (!roles.value) loading.value = true;

		try {
			const rolesResponse = await api.get(`/roles`, {
				params: {
					sort: 'name',
					fields: ['id', 'name', 'icon', 'parent'],
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
