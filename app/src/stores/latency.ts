import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface LatencyRecord {
	timestamp: Date;
	latency: number;
}

export const useLatencyStore = defineStore('latencyStore', () => {
	const records = ref<LatencyRecord[]>([]);
	const maxRecords = 100;

	function save(record: LatencyRecord) {
		records.value.push(record);

		// Keep only the last maxRecords
		if (records.value.length > maxRecords) {
			records.value = records.value.slice(-maxRecords);
		}
	}

	function getAverageLatency(): number {
		if (records.value.length === 0) return 0;
		const sum = records.value.reduce((acc, r) => acc + r.latency, 0);
		return sum / records.value.length;
	}

	function clear() {
		records.value = [];
	}

	return {
		records,
		save,
		getAverageLatency,
		clear,
	};
});
