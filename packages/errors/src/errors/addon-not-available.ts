import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export const messageConstructor = (): string => `Addon exists but is not available on the current plan.`;

export const AddonNotAvailableError: DirectusErrorConstructor = createError(
	ErrorCode.AddonNotAvailable,
	messageConstructor,
	409,
);
