import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export const messageConstructor = (): string => `Licensing service is unreachable.`;

export const LicenseServiceUnavailableError: DirectusErrorConstructor = createError(
	ErrorCode.LicenseServiceUnavailable,
	messageConstructor,
	503,
);
