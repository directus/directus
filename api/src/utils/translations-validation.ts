import { REGEX_DB_SAFE_IDENTIFIER } from '@directus/constants';
import { z } from 'zod';

const DB_SAFE_IDENTIFIER_MESSAGE =
	'must be a db-safe identifier (letters, numbers, underscores; cannot start with a number)';

export const dbSafeIdentifierSchema = z
	.string()
	.trim()
	.min(1)
	.regex(REGEX_DB_SAFE_IDENTIFIER, DB_SAFE_IDENTIFIER_MESSAGE);
