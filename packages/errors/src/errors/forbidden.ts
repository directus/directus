import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

interface ForbiddenErrorExtensions {
	reason: string;
}

export const messageConstructor = (ext: ForbiddenErrorExtensions | void): string => {
	if (ext?.reason) return ext.reason;

	return `You don't have permission to access this.`;
};

export const ForbiddenError: DirectusErrorConstructor<void | ForbiddenErrorExtensions> = createError(
	ErrorCode.Forbidden,
	messageConstructor,
	403,
);
