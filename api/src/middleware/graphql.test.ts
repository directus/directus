import type { Request, Response } from 'express';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { InvalidPayloadException, InvalidQueryException, MethodNotAllowedException } from '../exceptions/index.js';
import { parseGraphQL } from './graphql.js';

let mockRequest: Partial<Request>;
let mockResponse: Partial<Response>;
const nextFunction = vi.fn();

beforeEach(() => {
	mockRequest = {};
	mockResponse = {};
});

afterEach(() => {
	vi.clearAllMocks();
});

test('should pass MethodNotAllowedException error to next() when using methods other than GET or POST', async () => {
	mockRequest = { method: 'PATCH' };
	await parseGraphQL(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(nextFunction.mock.calls[0][0]).toBeInstanceOf(MethodNotAllowedException);
	expect(nextFunction.mock.calls[0][0].message).toBe('GraphQL only supports GET and POST requests.');
});

test('should pass InvalidQueryException error to next() when GET request passed invalid variables', async () => {
	mockRequest = { method: 'GET', query: { variables: '{test}' } };
	await parseGraphQL(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(nextFunction.mock.calls[0][0]).toBeInstanceOf(InvalidQueryException);
	expect(nextFunction.mock.calls[0][0].message).toBe('Variables are invalid JSON.');
});

test('should pass InvalidPayloadException error to next() when GET request does not include query', async () => {
	mockRequest = { method: 'GET', query: {} };
	await parseGraphQL(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(nextFunction.mock.calls[0][0]).toBeInstanceOf(InvalidPayloadException);
	expect(nextFunction.mock.calls[0][0].message).toBe('Must provide query string.');
});

test('should pass InvalidPayloadException error to next() when POST request does not include query', async () => {
	mockRequest = { method: 'POST', body: {} };
	await parseGraphQL(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(nextFunction.mock.calls[0][0]).toBeInstanceOf(InvalidPayloadException);
	expect(nextFunction.mock.calls[0][0].message).toBe('Must provide query string.');
});

test('should pass InvalidPayloadException error to next() when GET request include a malformed query', async () => {
	mockRequest = { method: 'GET', query: { query: `query { test_collection {} }` } };
	await parseGraphQL(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(nextFunction.mock.calls[0][0]).toBeInstanceOf(InvalidPayloadException);
	expect(nextFunction.mock.calls[0][0].message).toBe('GraphQL schema validation error.');
});

test('should pass MethodNotAllowedException error to next() when GET request attempts to do mutation instead', async () => {
	const unallowedOperationInGet = 'mutation';
	mockRequest = {
		method: 'GET',
		query: { query: `${unallowedOperationInGet} { test_collection(id: 1, data: { name: "An updated name" }) { id } }` },
	};
	await parseGraphQL(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(nextFunction.mock.calls[0][0]).toBeInstanceOf(MethodNotAllowedException);
	expect(nextFunction.mock.calls[0][0].message).toBe(
		`Can only perform a ${unallowedOperationInGet} from a POST request.`
	);
});

test('should not prevent caching response for queries', async () => {
	mockRequest = {
		method: 'GET',
		body: { query: `query { test_collection { id } }` },
	};
	mockResponse = { locals: {} };
	await parseGraphQL(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(mockResponse.locals?.cache).toBe(undefined);
});

test('should prevent caching response for mutations by setting res.locals.cache to false', async () => {
	mockRequest = {
		method: 'POST',
		body: { query: `mutation { test_collection(id: 1, data: { name: "An updated name" }) { id } }` },
	};
	mockResponse = { locals: {} };
	await parseGraphQL(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(mockResponse.locals?.cache).toBe(false);
});

test('should add graphqlParams to res.locals on success', async () => {
	const operationName = 'TestQuery';
	const query = `query ${operationName} { test_collection { id } }`;
	mockRequest = {
		method: 'GET',
		query: { query, operationName },
	};
	mockResponse = { locals: {} };
	await parseGraphQL(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(mockResponse.locals?.graphqlParams).toMatchObject({ query, variables: {}, operationName });
});
