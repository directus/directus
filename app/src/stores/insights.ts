import { Dashboard } from '../types';
import api from '@/api';
import { createStore } from 'pinia';

export const useInsightsStore = createStore({
	id: 'insightsStore',
	state: () => ({
		dashboards: [] as Dashboard[],
	}),
	actions: {
		async hydrate() {
			const response = await api.get('/dashboards', { params: { limit: -1, fields: ['*', 'panels.*'] } });
			this.state.dashboards = response.data.data;
		},
		dehydrate() {
			this.reset();
		},
	},
});
