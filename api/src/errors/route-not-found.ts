import { createError } from '@directus/errors';

export interface RouteNotFoundErrorExtensions {
	path: string;
}

export const messageConstructor = ({ path }: RouteNotFoundErrorExtensions) => `Route ${path} doesn't exist.`;

export const RouteNotFoundError = createError('ROUTE_NOT_FOUND', messageConstructor, 404);
