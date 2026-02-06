import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export const OutOfDateError: DirectusErrorConstructor<void> = createError(
	ErrorCode.OutOfDate,
	'Operation could not be executed: Your current instance of Directus is out of date.',
	503,
);
