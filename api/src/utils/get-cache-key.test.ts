import { Request } from 'express';
import { getCacheKey } from './get-cache-key';
import * as getGraphqlQueryUtil from './get-graphql-query-and-variables';
import { afterEach, beforeAll, describe, expect, SpyInstance, test, vi } from 'vitest';

const baseUrl = 'http://localhost';
const restUrl = `${baseUrl}/items/example`;
const graphQlUrl = `${baseUrl}/graphql`;
const accountability = { user: '00000000-0000-0000-0000-000000000000' };
const method = 'GET';

const requests = [
	{
		name: 'as unauthenticated request',
		params: { method, originalUrl: restUrl },
		key: '17da8272c9a0ec6eea38a37d6d78bddeb7c79045',
	},
	{
		name: 'as authenticated request',
		params: { method, originalUrl: restUrl, accountability },
		key: '99a6394222a3d7d149ac1662fc2fff506932db58',
	},
	{
		name: 'a request with a fields query',
		params: { method, originalUrl: restUrl, sanitizedQuery: { fields: ['id', 'name'] } },
		key: 'aa6e2d8a78de4dfb4af6eaa230d1cd9b7d31ed19',
	},
	{
		name: 'a request with a filter query',
		params: { method, originalUrl: restUrl, sanitizedQuery: { filter: { name: { _eq: 'test' } } } },
		key: 'd7eb8970f0429e1cf85e12eb5bb8669f618b09d3',
	},
	{
		name: 'a GraphQL GET query request',
		params: { method, originalUrl: graphQlUrl, query: { query: 'query { test { id } }' } },
		key: '201731b75c627c60554512d819b6935b54c73814',
	},
	{
		name: 'a GraphQL POST query request',
		params: { method: 'POST', originalUrl: graphQlUrl, body: { query: 'query { test { name } }' } },
		key: '64eb0c48ea69d0863ff930398f29b5c7884f88f7',
	},
	{
		name: 'an authenticated GraphQL GET query request',
		params: { method, originalUrl: graphQlUrl, accountability, query: { query: 'query { test { id } }' } },
		key: '9bc52c98dcf2de04c64589f52e0ada1e38d53a90',
	},
	{
		name: 'an authenticated GraphQL POST query request',
		params: { method: 'POST', originalUrl: graphQlUrl, accountability, body: { query: 'query { test { name } }' } },
		key: '051ea77ce5ba71bbc88bcb567b9ddc602b585c13',
	},
];

const cases = requests.map(({ name, params, key }) => [name, params, key]);

afterEach(() => {
	vi.clearAllMocks();
});

describe('get cache key', () => {
	describe('isGraphQl', () => {
		let getGraphqlQuerySpy: SpyInstance;

		beforeAll(() => {
			getGraphqlQuerySpy = vi.spyOn(getGraphqlQueryUtil, 'getGraphqlQueryAndVariables');
		});

		test.each(['/items/test', '/items/graphql', '/collections/test', '/collections/graphql'])(
			'path "%s" should not be interpreted as a graphql query',
			(path) => {
				getCacheKey({ originalUrl: `${baseUrl}${path}` } as Request);
				expect(getGraphqlQuerySpy).not.toHaveBeenCalled();
			}
		);

		test.each(['/graphql', '/graphql/system'])('path "%s" should be interpreted as a graphql query', (path) => {
			getCacheKey({ originalUrl: `${baseUrl}${path}` } as Request);
			expect(getGraphqlQuerySpy).toHaveBeenCalledOnce();
		});
	});

	test.each(cases)('should create a cache key for %s', (_, params, key) => {
		expect(getCacheKey(params as unknown as Request)).toEqual(key);
	});

	test('should create a unique key for each request', () => {
		const keys = cases.map(([, params]) => getCacheKey(params as unknown as Request));
		const hasDuplicate = keys.some((key) => keys.indexOf(key) !== keys.lastIndexOf(key));

		expect(hasDuplicate).toBeFalsy();
	});

	test('should create a unique key for GraphQL requests with different variables', () => {
		const query = 'query Test ($name: String) { test (filter: { name: { _eq: $name } }) { id } }';
		const operationName = 'test';
		const variables1 = JSON.stringify({ name: 'test 1' });
		const variables2 = JSON.stringify({ name: 'test 2' });
		const req1: any = { method, originalUrl: graphQlUrl, query: { query, operationName, variables: variables1 } };
		const req2: any = { method, originalUrl: graphQlUrl, query: { query, operationName, variables: variables2 } };
		const postReq1: any = { method: 'POST', originalUrl: req1.originalUrl, body: req1.query };
		const postReq2: any = { method: 'POST', originalUrl: req2.originalUrl, body: req2.query };

		expect(getCacheKey(req1)).not.toEqual(getCacheKey(req2));
		expect(getCacheKey(postReq1)).not.toEqual(getCacheKey(postReq2));
		expect(getCacheKey(req1)).toEqual(getCacheKey(postReq1));
		expect(getCacheKey(req2)).toEqual(getCacheKey(postReq2));
	});
});
