import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export const messageConstructor = (): string => `Addon id is not in the catalog for the current subscription.`;

export const AddonNotFoundError: DirectusErrorConstructor = createError(
	ErrorCode.AddonNotFound,
	messageConstructor,
	404,
);
