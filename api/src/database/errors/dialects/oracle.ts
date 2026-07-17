import { ContainsNullValuesError, InvalidForeignKeyError } from '@directus/errors';
import type { OracleError } from './types.js';

enum OracleErrorCodes {
	'CONTAINS_NULL_VALUES' = 2296,
	'FOREIGN_KEY_VIOLATION' = 2291,
	// @TODO extend with other errors
}

export function extractError(error: OracleError): OracleError | Error {
	switch (error.errorNum) {
		case OracleErrorCodes.CONTAINS_NULL_VALUES:
			return containsNullValues(error);
		case OracleErrorCodes.FOREIGN_KEY_VIOLATION:
			return foreignKeyViolation(error);
		default:
			return error;
	}
}

function containsNullValues(error: OracleError): OracleError | InstanceType<typeof ContainsNullValuesError> {
	const betweenQuotes = /"([^"]+)"/g;
	const matches = error.message.match(betweenQuotes);

	if (!matches) return error;

	const collection = matches[0]!.slice(1, -1);
	const field = matches[1]!.slice(1, -1);

	return new ContainsNullValuesError({ collection, field });
}

function foreignKeyViolation(error: OracleError): OracleError | InstanceType<typeof InvalidForeignKeyError> {
	// NOTE:
	// Oracle doesn't report the offending column, so we surface the foreign key constraint name from
	// the error message instead. The constraint is reported qualified with its schema, e.g.
	//
	// ORA-02291: integrity constraint (DIRECTUS.ARTICLES_AUTHOR_FOREIGN) violated - parent key not found

	const constraint = /\(([^)]+)\)/.exec(error.message)?.[1]?.split('.').pop() ?? null;

	return new InvalidForeignKeyError({
		collection: null,
		field: null,
		value: null,
		constraint,
	});
}
