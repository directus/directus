import { createError, ErrorCode } from '../index.js';

export interface InvalidPathParameterErrorExtensions {
	reason: string;
}

export const messageConstructor = ({ reason }: InvalidPathParameterErrorExtensions) =>
	`Invalid path parameter. ${reason}.`;

export const InvalidPathParameterError = createError<InvalidPathParameterErrorExtensions>(
	ErrorCode.InvalidPathParameter,
	messageConstructor,
	400,
);
