import { Request } from 'express';
import { getCacheKey } from '../../src/utils/get-cache-key';

const restUrl = 'http://localhost/items/example';
const graphQlUrl = 'http://localhost/graphql';
const accountability = { user: '00000000-0000-0000-0000-000000000000' };

const requests = [
	{
		name: 'as unauthenticated request',
		params: { originalUrl: restUrl },
		key: '17da8272c9a0ec6eea38a37d6d78bddeb7c79045',
	},
	{
		name: 'as authenticated request',
		params: { originalUrl: restUrl, accountability },
		key: '99a6394222a3d7d149ac1662fc2fff506932db58',
	},
	{
		name: 'a request with a fields query',
		params: { originalUrl: restUrl, sanitizedQuery: { fields: ['id', 'name'] } },
		key: 'aa6e2d8a78de4dfb4af6eaa230d1cd9b7d31ed19',
	},
	{
		name: 'a request with a filter query',
		params: { originalUrl: restUrl, sanitizedQuery: { filter: { name: { _eq: 'test' } } } },
		key: 'd7eb8970f0429e1cf85e12eb5bb8669f618b09d3',
	},
	{
		name: 'a GraphQL query request',
		params: { originalUrl: graphQlUrl, query: { query: 'query { test { id } }' } },
		key: '201731b75c627c60554512d819b6935b54c73814',
	},
];

const cases = requests.map(({ name, params, key }) => [name, params, key]);

describe('get cache key', () => {
	test.each(cases)('should create a cache key for %s', (_, params, key) => {
		expect(getCacheKey(params as unknown as Request)).toEqual(key);
	});

	test('should create a unique key for each request', () => {
		const keys = requests.map((r) => r.key);
		const hasDuplicate = keys.some((key) => keys.indexOf(key) !== keys.lastIndexOf(key));

		expect(hasDuplicate).toBeFalsy();
	});

	test('should create a unique key for GraphQL requests with different variables', () => {
		const query = 'query Test ($name: String) { test (filter: { name: { _eq: $name } }) { id } }';
		const operationName = 'test';
		const variables1 = JSON.stringify({ name: 'test 1' });
		const variables2 = JSON.stringify({ name: 'test 2' });
		const req1: any = { originalUrl: graphQlUrl, query: { query, operationName, variables: variables1 } };
		const req2: any = { originalUrl: graphQlUrl, query: { query, operationName, variables: variables2 } };

		expect(getCacheKey(req1)).not.toEqual(getCacheKey(req2));
	});
});
