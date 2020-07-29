import getRootPath from './get-root-path';

describe('Utils / get root path', () => {
	it('Calculates the correct API root URL based on window', () => {
		Object.defineProperty(window, 'location', {
			value: {
				pathname: '/api/nested/admin',
			},
			writable: true,
		});

		const result = getRootPath();
		expect(result).toBe('/api/nested/');
	});
});
