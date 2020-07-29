import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import { useRequestsStore } from './requests';

describe('Stores / Projects', () => {
	beforeAll(() => {
		Vue.use(VueCompositionAPI);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('Computes the queueHasItems state', () => {
		const store = useRequestsStore({});
		store.state.queue = ['abc', 'def', 'gh'];
		expect(store.queueHasItems.value).toBe(true);
		store.state.queue = [];
		expect(store.queueHasItems.value).toBe(false);
	});

	test('Queue management', () => {
		const store = useRequestsStore({});
		expect(store.state.queue.length).toBe(0);
		const id = store.startRequest();
		expect(store.state.queue.length).toBe(1);
		expect(id).toBe(store.state.queue[0]);
		store.endRequest(id);
		expect(store.state.queue.length).toBe(0);
	});
});
