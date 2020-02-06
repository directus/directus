import { getRootPath } from './api';

describe('API', () => {
	beforeAll(() => {
		globalThis.window = Object.create(window);
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
});
