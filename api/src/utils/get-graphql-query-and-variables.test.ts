import type { Request } from 'express';
import { expect, test } from 'vitest';
import { getGraphqlQueryAndVariables } from './get-graphql-query-and-variables.js';

const query = `
	query getProduct($id: ID!) {
		products_by_id(id: $id) {
			id
		}
	}
`;

const variables = JSON.stringify({ id: 1 });
const additionalProperty = 'test';

test('should get query from request query for GET method', async () => {
	const request = { method: 'GET', query: { query, variables, additionalProperty } } as unknown as Request;
	expect(getGraphqlQueryAndVariables(request)).toEqual({ query, variables });
});

test('should get query from request body for other methods', async () => {
	const request = { method: 'POST', body: { query, variables, additionalProperty } } as unknown as Request;
	expect(getGraphqlQueryAndVariables(request)).toEqual({ query, variables });
});
