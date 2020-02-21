import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import { onRequest, onResponse, onError, getRootPath } from './api';
import * as auth from '@/auth';
import { useRequestsStore } from '@/stores/requests';

describe('API', () => {
	beforeAll(() => {
		globalThis.window = Object.create(window);
		Vue.use(VueCompositionAPI);
		jest.spyOn(auth, 'logout');
		jest.spyOn(auth, 'checkAuth');
	});

	beforeEach(() => {
		(auth.logout as jest.Mock).mockClear();
		(auth.checkAuth as jest.Mock).mockClear();
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

	it('Passes the error on to the next catch handler on unrelated 401 errors', async () => {
		const store = useRequestsStore({});
		try {
			await onError({
				response: {
					status: 401,
					config: {
						id: 'abc'
					}
				}
			});
		} catch (error) {
			expect(error).toEqual({ response: { status: 401, config: { id: 'abc' } } });
		}

		try {
			await onError({
				response: {
					status: 500,
					config: {
						id: 'abc'
					}
				}
			});
		} catch (error) {
			expect(error).toEqual({ response: { status: 500, config: { id: 'abc' } } });
		}

		try {
			await onError({
				response: {
					status: 401,
					config: {
						id: 'abc'
					},
					data: {
						error: {
							code: 5
						}
					}
				}
			});
		} catch (error) {
			expect(error).toEqual({
				response: {
					status: 401,
					config: { id: 'abc' },
					data: {
						error: {
							code: 5
						}
					}
				}
			});
		}
	});

	it('Checks the auth status on 401+3 errors', async () => {
		try {
			await onError({
				response: {
					config: {
						id: 'abc'
					},
					status: 401,
					data: {
						error: {
							code: 3
						}
					}
				}
			});
		} catch {
			expect(auth.checkAuth).toHaveBeenCalled();
		}
	});

	it('Forces a logout when the users is not logged in on 401+3 errors', async () => {
		(auth.checkAuth as jest.Mock).mockImplementation(async () => false);

		try {
			await onError({
				response: {
					config: {
						id: 'abc'
					},
					status: 401,
					data: {
						error: {
							code: 3
						}
					}
				}
			});
		} catch {
			expect(auth.logout).toHaveBeenCalledWith(auth.LogoutReason.ERROR_SESSION_EXPIRED);
		}
	});

	it('Does not call logout if the user is logged in on 401+3 error', async () => {
		(auth.checkAuth as jest.Mock).mockImplementation(async () => true);

		try {
			await onError({
				response: {
					config: {
						id: 'abc'
					},
					status: 401,
					data: {
						error: {
							code: 3
						}
					}
				}
			});
		} catch {
			expect(auth.logout).not.toHaveBeenCalled();
		}
	});
});
