import { useEnv } from '@directus/env';
import type { Request } from 'express';
import type { Knex } from 'knex';
import { afterEach, beforeAll, beforeEach, describe, expect, type MockInstance, test, vi } from 'vitest';
import { getDatabase } from '../database/index.js';
import { fetchPoliciesIpAccess } from '../permissions/modules/fetch-policies-ip-access/fetch-policies-ip-access.js';
import { getCacheKey } from './get-cache-key.js';
import * as getGraphqlQueryUtil from './get-graphql-query-and-variables.js';

vi.mock('../database/index.js');

vi.mock('../permissions/modules/fetch-policies-ip-access/fetch-policies-ip-access.js');

vi.mock('directus/version', () => ({ version: '1.2.3' }));

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		REDIS_ENABLED: false,
	}),
}));

beforeEach(() => {
	vi.mocked(getDatabase).mockReturnValue({} as Knex);
});

const baseUrl = 'http://localhost';
const restUrl = `${baseUrl}/items/example`;
const graphQlUrl = `${baseUrl}/graphql`;
const accountability = { user: '00000000-0000-0000-0000-000000000000' };
const method = 'GET';

const requests = [
	{
		name: 'as unauthenticated request',
		params: { method, originalUrl: restUrl },
		key: '20ada3d7cc37fb7e742d2a723f6f1d7a64686d2e',
	},
	{
		name: 'as authenticated request',
		params: { method, originalUrl: restUrl, accountability },
		key: '79daba5bf38b6b80cb4bf4e2de95d6a8380f7927',
	},
	{
		name: 'a request with a fields query',
		params: { method, originalUrl: restUrl, sanitizedQuery: { fields: ['id', 'name'] } },
		key: 'e1839f7379b39188622e797fdbe2e3e6d477cbdc',
	},
	{
		name: 'a request with a filter query',
		params: { method, originalUrl: restUrl, sanitizedQuery: { filter: { name: { _eq: 'test' } } } },
		key: '0bcc9af5f628db85043133e59226b2de154d7183',
	},
	{
		name: 'a GraphQL GET query request',
		params: { method, originalUrl: graphQlUrl, query: { query: 'query { test { id } }' } },
		key: '14bc276cf21e2d22334b84841533e2c8e1bba9bd',
	},
	{
		name: 'a GraphQL POST query request',
		params: { method: 'POST', originalUrl: graphQlUrl, body: { query: 'query { test { name } }' } },
		key: 'c5bf03e138e0f7bbaa50dde9cad554bef47a81d2',
	},
	{
		name: 'an authenticated GraphQL GET query request',
		params: { method, originalUrl: graphQlUrl, accountability, query: { query: 'query { test { id } }' } },
		key: '981f27be4c0cfed0b4eca6ac2514f6629aea6be1',
	},
	{
		name: 'an authenticated GraphQL POST query request',
		params: { method: 'POST', originalUrl: graphQlUrl, accountability, body: { query: 'query { test { name } }' } },
		key: '358336a2c61f7ea2b41b5c1566bbebe692be601d',
	},
];

const cases = requests.map(({ name, params, key }) => [name, params, key]);

beforeEach(() => {
	vi.mocked(useEnv).mockReturnValue({});
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('get cache key', async () => {
	describe('isGraphQl', async () => {
		let getGraphqlQuerySpy: MockInstance;

		beforeAll(() => {
			getGraphqlQuerySpy = vi.spyOn(getGraphqlQueryUtil, 'getGraphqlQueryAndVariables');
		});

		test.each(['/items/test', '/items/graphql', '/collections/test', '/collections/graphql'])(
			'path "%s" should not be interpreted as a graphql query',
			async (path) => {
				await getCacheKey({ originalUrl: `${baseUrl}${path}` } as Request);
				expect(getGraphqlQuerySpy).not.toHaveBeenCalled();
			},
		);

		test.each(['/graphql', '/graphql/system'])('path "%s" should be interpreted as a graphql query', async (path) => {
			await getCacheKey({ originalUrl: `${baseUrl}${path}` } as Request);
			expect(getGraphqlQuerySpy).toHaveBeenCalledOnce();
		});
	});

	test.each(cases)('should create a cache key for %s', async (_, params, key) => {
		expect(await getCacheKey(params as unknown as Request)).toEqual(key);
	});

	test('should create a unique key for each request', async () => {
		const keys = cases.map(async ([, params]) => await getCacheKey(params as unknown as Request));
		const hasDuplicate = keys.some((key) => keys.indexOf(key) !== keys.lastIndexOf(key));

		expect(hasDuplicate).toBeFalsy();
	});

	test('should create a unique key for GraphQL requests with different variables', async () => {
		const query = 'query Test ($name: String) { test (filter: { name: { _eq: $name } }) { id } }';
		const operationName = 'test';
		const variables1 = JSON.stringify({ name: 'test 1' });
		const variables2 = JSON.stringify({ name: 'test 2' });
		const req1: any = { method, originalUrl: graphQlUrl, query: { query, operationName, variables: variables1 } };
		const req2: any = { method, originalUrl: graphQlUrl, query: { query, operationName, variables: variables2 } };
		const postReq1: any = { method: 'POST', originalUrl: req1.originalUrl, body: req1.query };
		const postReq2: any = { method: 'POST', originalUrl: req2.originalUrl, body: req2.query };

		expect(await getCacheKey(req1)).not.toEqual(await getCacheKey(req2));
		expect(await getCacheKey(postReq1)).not.toEqual(await getCacheKey(postReq2));
		expect(await getCacheKey(req1)).toEqual(await getCacheKey(postReq1));
		expect(await getCacheKey(req2)).toEqual(await getCacheKey(postReq2));
	});

	test('it should create a unique key for requests which match a policy ip_access filter', async () => {
		const reqWithMatchingIp: any = {
			method,
			originalUrl: restUrl,
			accountability: { ...accountability, ip: '127.0.0.1' },
		};

		const reqWithNotMatchingIp: any = {
			method,
			originalUrl: restUrl,
			accountability: { ...accountability, ip: '127.0.0.2' },
		};

		const reqWithoutIp: any = { method, originalUrl: restUrl, accountability: { ...accountability } };

		vi.mocked(fetchPoliciesIpAccess).mockResolvedValue([['127.0.0.1']]);

		expect(await getCacheKey(reqWithMatchingIp)).not.toEqual(await getCacheKey(reqWithoutIp));
		expect(await getCacheKey(reqWithNotMatchingIp)).toEqual(await getCacheKey(reqWithoutIp));
	});
});
