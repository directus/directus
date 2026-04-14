import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export interface InvalidPathParameterErrorExtensions {
	reason: string;
}

export const messageConstructor = ({ reason }: InvalidPathParameterErrorExtensions) =>
	`Invalid path parameter. ${reason}.`;

export const InvalidPathParameterError: DirectusErrorConstructor<InvalidPathParameterErrorExtensions> =
	createError<InvalidPathParameterErrorExtensions>(ErrorCode.InvalidPathParameter, messageConstructor, 400);
