import { ForbiddenError } from '@directus/errors';
import type { Accountability } from '@directus/types';
import type { NextFunction, Request, Response } from 'express';
import { afterEach, expect, it, test, vi } from 'vitest';
import { handler } from './mcp-oauth-guard.js';
import '../types/express.d.ts';

const res = {} as Response;
const next = vi.fn() as NextFunction;

afterEach(() => {
	vi.clearAllMocks();
});

function makeReq(overrides: Partial<Request> = {}): Request {
	return {
		method: 'GET',
		path: '/items/test',
		token: null,
		accountability: { user: 'user-id', role: null, roles: [], admin: false, app: false, ip: null } as Accountability,
		...overrides,
	} as unknown as Request;
}

function makeOAuthReq(path: string, method = 'GET'): Request {
	return makeReq({
		method,
		path,
		accountability: {
			user: 'user-id',
			role: null,
			roles: [],
			admin: false,
			app: false,
			ip: null,
			oauth: { client: 'my-client', scopes: ['mcp:access'], aud: ['https://example.com/mcp'] },
		} as Accountability,
	});
}

test('allows regular sessions on any route', () => {
	const req = makeReq({ path: '/items/test' });
	handler(req, res, next);
	expect(next).toHaveBeenCalledWith();
	expect(next).toHaveBeenCalledTimes(1);
});

it.each([
	['GET', '/mcp'],
	['GET', '/mcp/'],
	['POST', '/mcp'],
	['POST', '/mcp/'],
])('allows OAuth sessions on %s %s', (method, path) => {
	const req = makeOAuthReq(path, method);
	handler(req, res, next);
	expect(next).toHaveBeenCalledWith();
	expect(next).toHaveBeenCalledTimes(1);
});

it.each([
	'/items/test',
	'/graphql',
	'/mcp/server',
	'/mcp/some/nested/path',
	'/mcp-oauth/authorize/decision',
	'/mcp-oauth/token',
	'/mcp-oauth/register',
	'/mcp-oauth/revoke',
])('blocks OAuth sessions on %s', (path) => {
	const req = makeOAuthReq(path);
	handler(req, res, next);
	expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
});

it.each(['PUT', 'PATCH', 'DELETE'])('blocks OAuth sessions using %s on /mcp', (method) => {
	const req = makeOAuthReq('/mcp', method);
	handler(req, res, next);
	expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
});

test('passes through when accountability is undefined', () => {
	const req = makeReq({ accountability: undefined as any });
	handler(req, res, next);
	expect(next).toHaveBeenCalledWith();
});
