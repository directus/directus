import { Request, Response } from 'express';
import knex from 'knex';
import { getTracker, MockClient, Tracker } from 'knex-mock-client';
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { InvalidIPException } from '../exceptions';

vi.mock('../database', () => ({
	default: vi.fn().mockReturnValue(knex({ client: MockClient })),
}));

import { checkIP } from './check-ip';

const table = 'directus_roles';
const role = '00000000-0000-0000-0000-000000000000';
const validIP = '10.10.10.1';
const invalidIP = '10.10.20.2';
const accountability = {
	withValidIP: { role, ip: validIP },
	withInvalidIP: { role, ip: invalidIP },
};
const expectedSQL = {
	withAccountability: `select "ip_access" from "directus_roles" where "id" = ? limit ?`,
	withoutAccountability: `select "ip_access" from "directus_roles" where "id" is null limit ?`,
};
let tracker: Tracker;

let mockRequest: Partial<Request>;
let mockResponse: Partial<Response>;
const nextFunction = vi.fn();

beforeAll(() => {
	tracker = getTracker();
	mockRequest = {};
	mockResponse = {};
});

afterEach(() => {
	tracker.reset();
	vi.clearAllMocks();
});

test('should pass for requests without accountability', async () => {
	tracker.on.select(table).response({});
	mockRequest = { accountability: {} } as any;
	await checkIP(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(tracker.history.select[0]?.sql).toBe(expectedSQL.withoutAccountability);
});

test('should pass for requests with accountability but no configured IP allow list', async () => {
	tracker.on.select(table).response({ ip_access: '' });
	mockRequest = { accountability: accountability.withValidIP } as any;
	await checkIP(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(tracker.history.select[0]?.sql).toBe(expectedSQL.withAccountability);
});

test('should pass for requests with accountability but with allowed IP', async () => {
	tracker.on.select(table).response({ ip_access: validIP });
	mockRequest = { accountability: accountability.withValidIP } as any;
	await checkIP(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(tracker.history.select[0]?.sql).toBe(expectedSQL.withAccountability);
});

test('should pass InvalidIPException error to next() for requests with accountability but without allowed IP', async () => {
	tracker.on.select(table).response({ ip_access: validIP });
	mockRequest = { accountability: accountability.withInvalidIP } as any;
	await checkIP(mockRequest as Request, mockResponse as Response, nextFunction);
	expect(nextFunction.mock.calls[0][0]).toBeInstanceOf(InvalidIPException);
});
