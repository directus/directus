import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export const InvalidIpError: DirectusErrorConstructor<void> = createError(
	ErrorCode.InvalidIp,
	'Invalid IP address.',
	401,
);
