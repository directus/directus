import { createStore } from 'pinia';
import { useProjectsStore } from '@/stores/projects';
import api from '@/api';

import { User } from './types';

export const useUserStore = createStore({
	id: 'userStore',
	state: () => ({
		currentUser: null as User | null
	}),
	getters: {
		fullName(state) {
			if (state.currentUser === null) return null;
			return state.currentUser.first_name + ' ' + state.currentUser.last_name;
		}
	},
	actions: {
		async hydrate() {
			const projectsStore = useProjectsStore();
			const currentProjectKey = projectsStore.state.currentProjectKey;

			const { data } = await api.get(`/${currentProjectKey}/users/me`, {
				params: {
					fields: '*,avatar.data'
				}
			});

			this.state.currentUser = data.data;
		},
		async dehydrate() {
			this.reset();
		}
	}
});
