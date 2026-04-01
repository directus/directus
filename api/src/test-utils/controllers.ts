/**
 * Controller testing utilities
 * Provides helpers for extracting route handlers and creating mock Express request/response objects
 */

import type { SchemaOverview } from '@directus/types';
import type { Request, Response, Router } from 'express';
import { vi } from 'vitest';

/**
 * Get a route handler stack from an Express router
 *
 * @param router The Express router instance to search
 * @param method HTTP method (GET, POST, PATCH, DELETE, etc.)
 * @param path Route path (e.g. '/', '/:id')
 * @returns Array of middleware/handler layers for the matched route
 *
 * @example
 * ```typescript
 * import { default as router } from './controller.js';

 * const [firstHandler, secondHandler] = getRouteHandler(router, 'POST', '/');
 * await firstHandler?.handle(req, res, next);
 * ```
 */
export function getRouteHandler(router: Router, method: string, path: string) {
	const stack = (router as any).stack;

	const layer = stack.find((l: any) => l.route?.path === path && l.route?.methods[method.toLowerCase()]);

	if (!layer) throw new Error(`No route found for ${method} ${path}`);

	return layer.route.stack as Array<{ handle: (...args: any[]) => any }>;
}

/**
 * Creates a mock Express Request with common Directus properties.
 *
 * @param overrides Properties to merge into the mock request
 * @returns Mock Express Request object
 *
 * @example
 * ```typescript
 * // Basic usage
 * const req = createMockRequest({ method: 'POST', accountability });
 *
 * // With custom schema
 * const req = createMockRequest({
 *   method: 'PATCH',
 *   params: { id: 'file-1' },
 *   schema: mySchema,
 * });
 *
 * // With custom header mock
 * const req = createMockRequest({
 *   header: vi.fn().mockReturnValue('some-header-value'),
 * });
 * ```
 */
export function createMockRequest(overrides: Partial<Request> = {}): Request {
	const headerFn = vi.fn().mockReturnValue(undefined);

	return {
		method: 'GET',
		headers: {},
		params: {},
		body: {},
		header: headerFn,
		get: headerFn,
		is: vi.fn().mockReturnValue(false),
		token: null,
		collection: '',
		singleton: false,
		accountability: undefined,
		sanitizedQuery: {},
		schema: {
			collections: {},
			relations: [],
		} as unknown as SchemaOverview,
		...overrides,
	} as unknown as Request;
}

/**
 * Creates a mock Express Response with chainable methods.
 *
 * @param overrides Properties to merge into the mock response
 * @returns Mock Express Response object
 *
 * @example
 * ```typescript
 * // Basic usage
 * const res = createMockResponse();
 *
 * // With custom locals
 * const res = createMockResponse({ locals: { payload: { data: [] } } });
 * ```
 */
export function createMockResponse(overrides: Partial<Response> = {}): Response {
	return {
		locals: {},
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
		send: vi.fn().mockReturnThis(),
		set: vi.fn().mockReturnThis(),
		end: vi.fn().mockReturnThis(),
		...overrides,
	} as unknown as Response;
}
