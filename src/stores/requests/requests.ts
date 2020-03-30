import { createStore } from 'pinia';
import { nanoid } from 'nanoid';

export const useRequestsStore = createStore({
	id: 'requestsStore',
	state: () => ({
		queue: [] as string[],
	}),
	getters: {
		queueHasItems: (state) => state.queue.length > 0,
	},
	actions: {
		startRequest() {
			const id = nanoid();
			this.state.queue = [...this.state.queue, id];
			return id;
		},
		endRequest(id: string) {
			this.state.queue = this.state.queue.filter((queueID: string) => queueID !== id);
		},
	},
});
