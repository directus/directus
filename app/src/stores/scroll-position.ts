import { defineStore } from 'pinia';

export const useScrollPositionStore = defineStore({
	id: 'scrollPositionStore',
	state: () => ({
		top: 0 as number | null,
	}),
	actions: {
		setTop(top: number | null) {
			this.top = top;
		},
	},
});
