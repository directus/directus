import { Request } from 'express';
import { expect, test } from 'vitest';

import { getGraphqlQueryAndVariables } from './get-graphql-query-and-variables';

const query = `
	query getProduct($id: ID!) {
		products_by_id(id: $id) {
			id
		}
	}
`;
const variables = JSON.stringify({ id: 1 });
const additionalProperty = 'test';
const mockedRequestWithQuery = { method: 'GET', query: { query, variables, additionalProperty } } as unknown as Request;
const mockedRequestWithBody = { method: 'POST', body: { query, variables, additionalProperty } } as unknown as Request;

test('should get query from request query for GET method', async () => {
	expect(getGraphqlQueryAndVariables(mockedRequestWithQuery)).toEqual({ query, variables });
});

test('should get query from request body for other methods', async () => {
	expect(getGraphqlQueryAndVariables(mockedRequestWithBody)).toEqual({ query, variables });
});
