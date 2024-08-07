import { createError, ErrorCode } from '../index.js';

interface ForbiddenErrorExtensions {
	reason: string;
}

export const messageConstructor = (ext: ForbiddenErrorExtensions | void) => {
	if (ext?.reason) return ext.reason;

	return `You don't have permission to access this.`;
};

export const ForbiddenError = createError(ErrorCode.Forbidden, messageConstructor, 403);
