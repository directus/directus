import { createStore } from 'pinia';
import api from '@/api';
import { useProjectsStore } from '@/stores/projects';

import { Role } from './types';

export const useRolesStore = createStore({
	id: 'rolesStore',
	state: () => ({
		roles: [] as Role[],
	}),
	actions: {
		async hydrate() {
			const projectsStore = useProjectsStore();
			const currentProjectKey = projectsStore.state.currentProjectKey;

			const rolesResponse = await api.get(`/${currentProjectKey}/roles`);

			this.state.roles = rolesResponse.data.data;
		},
		async dehydrate() {
			this.reset();
		},
	},
});
