import { createError, ErrorCode } from '../index.js';

export interface MethodNotAllowedErrorExtensions {
	allowed: string[];
	current: string;
}

export const messageConstructor = (extensions: MethodNotAllowedErrorExtensions) =>
	`Invalid method "${extensions.current}" used. Should be one of ${extensions.allowed
		.map((method) => `"${method}"`)
		.join(', ')}.`;

export const MethodNotAllowedError = createError<MethodNotAllowedErrorExtensions>(
	ErrorCode.MethodNotAllowed,
	messageConstructor,
	405,
);
