import { defineStore } from 'pinia';

type Latency = {
	latency: number;
	timestamp: Date;
};

export const useLatencyStore = defineStore({
	id: 'latencyStore',
	state: () => ({
		latency: [] as Latency[],
	}),
	actions: {
		async dehydrate() {
			this.$reset();
		},
		save(latency: Latency) {
			this.latency.push(latency);
			this.latency = this.latency.slice(-20);
		},
	},
});
