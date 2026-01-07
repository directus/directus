import { Role } from '@directus/types';
import { groupBy } from 'lodash';
import { computed, ref, Ref, watch } from 'vue';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';

let roles: Ref<BasicRole[] | null> | null = null;
let loading: Ref<boolean> | null = null;

export type BasicRole = Pick<Role, 'id' | 'name' | 'icon' | 'parent'> & { children?: BasicRole[] };

const globalOpenRoles = ref<string[]>([]);

// TODO make this work with new r&p
export default function useNavigation(initialRole: Ref<string | undefined>): {
	roles: Ref<BasicRole[] | null>;
	roleTree: Ref<BasicRole[]>;
	openRoles: Ref<string[]>;
	loading: Ref<boolean>;
} {
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
		if (!roles?.value) return [];

		const root = Symbol();
		const rolesByParent = groupBy(roles.value, (role) => role.parent ?? root) as Record<string | symbol, BasicRole[]>;

		return rolesByParent[root]?.map(buildTree) ?? [];

		function buildTree(role: BasicRole): BasicRole {
			const children = rolesByParent[role.id];

			if (!children) return role;

			return {
				...role,
				children: children.map(buildTree),
			};
		}
	});

	watch(
		[() => initialRole.value, roles],
		() => {
			if (!initialRole?.value) return;
			if (globalOpenRoles.value.includes(initialRole.value!)) return;
			if (!roles?.value) return;

			let current = roles.value.find((role) => role.id === initialRole.value);

			while (current) {
				globalOpenRoles.value.push(current.id);
				current = roles.value.find((role) => role.id === current?.parent);
			}
		},
		{ immediate: true },
	);

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
