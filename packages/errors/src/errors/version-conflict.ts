import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export const VersionConflictError: DirectusErrorConstructor<void> = createError(
	ErrorCode.VersionConflict,
	'Version has been saved since the provided base date.',
	409,
);
