import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export const messageConstructor = (): string => `Quantity is outside the allowed range for this addon.`;

export const AddonQuantityOutOfRangeError: DirectusErrorConstructor = createError(
	ErrorCode.AddonQuantityOutOfRange,
	messageConstructor,
	422,
);
