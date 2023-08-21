import { ExtensionInfo } from '@directus/types';
import api from '@/api';
import { defineStore } from 'pinia';
import { useUserStore } from '@/stores/user';

export const useExtensionsStore = defineStore({
	id: 'extensionsStore',
	state: () => ({
		extensions: [] as ExtensionInfo[],
	}),
	actions: {
		async hydrate() {
			const { isAdmin } = useUserStore();

			if (isAdmin !== true) {
				this.extensions = [];
				return;
			}

			try {
				const response = await api.get<any>('/extensions', {
					params: { limit: -1, fields: ['*'] },
				});

				this.extensions = response.data.data;
			} catch {
				this.extensions = [];
			}
		},
		async dehydrate() {
			this.$reset();
		},
	},
});
