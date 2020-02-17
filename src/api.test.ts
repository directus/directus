import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import { onRequest, onResponse, onError, getRootPath } from './api';
import { useRequestsStore } from '@/stores/requests';

describe('API', () => {
	beforeAll(() => {
		globalThis.window = Object.create(window);
		Vue.use(VueCompositionAPI);
	});

	it('Calculates the correct API root URL based on window', () => {
		Object.defineProperty(window, 'location', {
			value: {
				pathname: '/api/nested/admin'
			},
			writable: true
		});

		const result = getRootPath();
		expect(result).toBe('/api/nested/');
	});

	it('Calls startRequest on the store on any request', () => {
		const store = useRequestsStore({});
		const spy = jest.spyOn(store, 'startRequest');
		spy.mockImplementation(() => 'abc');
		const newRequest = onRequest({});
		expect(spy).toHaveBeenCalled();
		expect(newRequest.id).toBe('abc');
	});

	it('Calls endRequest on responses', () => {
		const store = useRequestsStore({});
		const spy = jest.spyOn(store, 'endRequest');
		onResponse({
			data: null,
			status: 200,
			statusText: 'OK',
			headers: {},
			config: {
				id: 'abc'
			}
		});
		expect(spy).toHaveBeenCalledWith('abc');
	});

	it('Calls endRequest on errors', async () => {
		const store = useRequestsStore({});
		const spy = jest.spyOn(store, 'endRequest');
		try {
			await onError({
				response: {
					config: {
						id: 'abc'
					}
				}
			});
		} catch (error) {
			expect(error).toEqual({ response: { config: { id: 'abc' } } });
		}

		expect(spy).toHaveBeenCalledWith('abc');
	});
});
