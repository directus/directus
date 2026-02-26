import { describe, expect, test } from 'vitest';
import { formatApiRequestCounts } from './format-api-request-counts.js';

describe('formatApiRequestCounts', () => {
	test('Formats method counts with api_requests_ prefix', () => {
		const result = formatApiRequestCounts({ get: 10, post: 5 });

		expect(result['api_requests_get']).toBe(10);
		expect(result['api_requests_post']).toBe(5);
	});

	test('Calculates total across all methods', () => {
		const result = formatApiRequestCounts({ get: 10, post: 5, patch: 2, delete: 1 });

		expect(result['api_requests']).toBe(18);
	});

	test('Includes methods with zero counts', () => {
		const result = formatApiRequestCounts({ get: 10, put: 0 });

		expect(result['api_requests_put']).toBe(0);
	});

	test('Zero counts do not affect total', () => {
		const result = formatApiRequestCounts({ get: 10, put: 0 });

		expect(result['api_requests']).toBe(10);
	});

	test('Returns only api_requests total when given empty input', () => {
		const result = formatApiRequestCounts({});

		expect(result).toEqual({ api_requests: 0 });
	});

	test('Handles single method', () => {
		const result = formatApiRequestCounts({ get: 42 });

		expect(result).toEqual({
			api_requests_get: 42,
			api_requests: 42,
		});
	});

	test('Matches expected output shape from spec', () => {
		const result = formatApiRequestCounts({ get: 10, post: 5, put: 3, patch: 2, delete: 1 });

		expect(result).toEqual({
			api_requests_get: 10,
			api_requests_post: 5,
			api_requests_put: 3,
			api_requests_patch: 2,
			api_requests_delete: 1,
			api_requests: 21,
		});
	});

	test('Includes cached count in output but not in total', () => {
		const result = formatApiRequestCounts({ get: 10, post: 5, cached: 3 });

		expect(result['api_requests_cached']).toBe(3);
		expect(result['api_requests']).toBe(15);
	});
});
