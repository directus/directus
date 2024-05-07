import { nanoid } from 'nanoid';
import { defineStore } from 'pinia';

export const useRequestsStore = defineStore({
	id: 'requestsStore',
	state: () => ({
		queue: new Set<string>(),
	}),
	getters: {
		queueHasItems(): boolean {
			return this.queue.size > 0;
		},
	},
	actions: {
		startRequest() {
			const id = nanoid();
			this.queue.add(id);

			// If requests take more than 3.5 seconds, it's assumed they'll either never
			// happen, or already crashed
			setTimeout(() => this.endRequest(id), 3500);

			return id;
		},
		endRequest(id: string) {
			this.queue.delete(id);
		},
	},
});
