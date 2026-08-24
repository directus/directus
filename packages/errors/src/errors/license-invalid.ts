import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export const messageConstructor = (): string =>
	`License key cannot be applied (not found, expired, canceled, already bound elsewhere, malformed).`;

export const LicenseInvalidError: DirectusErrorConstructor = createError(
	ErrorCode.LicenseInvalid,
	messageConstructor,
	400,
);
