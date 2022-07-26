import { test, expect } from 'vitest';
import { addQueryToPath } from '@/utils/add-query-to-path';

test('Adds query parameters to given path', () => {
	const output = addQueryToPath('/path/to/something', {
		test: 'hello',
		another: 'world',
	});

	expect(output).toBe('/path/to/something?test=hello&another=world');
});

test('Keeps existing query parameters intact', () => {
	const output = addQueryToPath('/path/to/something?existing=param', {
		test: 'hello',
		another: 'world',
	});

	expect(output).toBe('/path/to/something?existing=param&test=hello&another=world');
});
