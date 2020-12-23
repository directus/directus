import { createStore } from 'pinia';
import api from '@/api';

type Info = {
	project: null | {
		project_name: string | null;
		project_logo: string | null;
		project_color: string | null;
		public_foreground: string | null;
		public_background: string | null;
		public_note: string | null;
		custom_css: string | null;
	};
	directus?: {
		version: string;
	};
	node?: {
		version: string;
		uptime: number;
	};
	os?: {
		type: string;
		version: string;
		uptime: number;
		totalmem: number;
	};
};

export const useServerStore = createStore({
	id: 'serverStore',
	state: () => ({
		info: null as null | Info,
	}),
	actions: {
		async hydrate() {
			const response = await api.get(`/server/info`, { params: { limit: -1 } });
			this.state.info = response.data.data;
		},
		dehydrate() {
			this.reset();
		},
	},
});
