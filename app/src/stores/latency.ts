import { defineStore } from 'pinia';
import { ref } from 'vue';

type Latency = {
	latency: number;
	timestamp: Date;
};

export const useLatencyStore = defineStore('latencyStore', () => {
	const latency = ref<Latency[]>([]);

	return {
		latency,
		dehydrate,
		save,
	};

	async function dehydrate() {
		latency.value = [];
	}

	function save(newLatency: Latency) {
		latency.value.push(newLatency);
		latency.value = latency.value.slice(-20);
	}
});
