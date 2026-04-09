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
		path: '/items/test',
		token: null,
		accountability: { user: 'user-id', role: null, roles: [], admin: false, app: false, ip: null } as Accountability,
		...overrides,
	} as unknown as Request;
}

function makeOAuthReq(path: string): Request {
	return makeReq({
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

it.each(['/mcp/server', '/mcp', '/mcp/some/nested/path'])('allows OAuth sessions on %s', (path) => {
	const req = makeOAuthReq(path);
	handler(req, res, next);
	expect(next).toHaveBeenCalledWith();
	expect(next).toHaveBeenCalledTimes(1);
});

it.each([
	'/items/test',
	'/graphql',
	'/mcp-oauth/authorize/decision',
	'/mcp-oauth/token',
	'/mcp-oauth/register',
	'/mcp-oauth/revoke',
])('blocks OAuth sessions on %s', (path) => {
	const req = makeOAuthReq(path);
	handler(req, res, next);
	expect(next).toHaveBeenCalledWith(expect.any(Error));
});

test('passes through when accountability is undefined', () => {
	const req = makeReq({ accountability: undefined as any });
	handler(req, res, next);
	expect(next).toHaveBeenCalledWith();
});
