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
			this.reset();
		},
		save(latency: Latency) {
			this.state.latency.push(latency);
			this.state.latency = this.state.latency.slice(-20);
		},
	},
});
