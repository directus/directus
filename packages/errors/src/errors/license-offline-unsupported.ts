import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export const messageConstructor = (): string =>
	`Operation requires the licensing service and is not available in offline mode.`;

export const LicenseOfflineUnsupportedError: DirectusErrorConstructor = createError(
	ErrorCode.LicenseOfflineUnsupported,
	messageConstructor,
	409,
);
