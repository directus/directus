import { createError, ErrorCode } from '../index.js';

export interface RouteNotFoundErrorExtensions {
	path: string;
}

export const messageConstructor = ({ path }: RouteNotFoundErrorExtensions) => `Route ${path} doesn't exist.`;

export const RouteNotFoundError = createError(ErrorCode.RouteNotFound, messageConstructor, 404);
