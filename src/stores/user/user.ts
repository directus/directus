import { createStore } from 'pinia';
import { useProjectsStore } from '@/stores/projects';
import api from '@/api';

import { User } from './types';

export const useUserStore = createStore({
	id: 'userStore',
	state: () => ({
		currentUser: null as User | null
	}),
	actions: {
		async hydrate() {
			const projectsStore = useProjectsStore();
			const currentProjectKey = projectsStore.state.currentProjectKey;

			const { data } = await api.get(`/${currentProjectKey}/users/me`);
			this.state.currentUser = data.data;
		},
		async dehydrate() {
			this.reset();
		}
	}
});
