import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export const messageConstructor = (): string =>
	`After applying, the instance is still over limits. Refresh the assessment and retry.`;

export const LicenseResolveIncompleteError: DirectusErrorConstructor = createError(
	ErrorCode.LicenseResolveIncomplete,
	messageConstructor,
	422,
);
