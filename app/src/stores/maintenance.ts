import { defineStore } from 'pinia';

export const useMaintenanceStore = defineStore({
	id: 'maintenanceStore',
	state: () => ({
		enabled: false,
	}),
	actions: {
		async dehydrate() {
			this.$reset();
		},
		update(enabled: boolean) {
			this.enabled = enabled;
		},
	},
});
