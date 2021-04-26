import { defineStore } from 'pinia';
import { nanoid } from 'nanoid';

export const useRequestsStore = defineStore({
	id: 'requestsStore',
	state: () => ({
		queue: [] as string[],
	}),
	getters: {
		queueHasItems() {
			return this.queue.length > 0;
		},
	},
	actions: {
		startRequest() {
			const id = nanoid();
			this.queue = [...this.queue, id];
			return id;
		},
		endRequest(id: string) {
			this.queue = this.queue.filter((queueID: string) => queueID !== id);
		},
	},
});
