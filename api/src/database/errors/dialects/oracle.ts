import type { OracleError } from './types.js';
import { ContainsNullValuesError } from '@directus/errors';

enum OracleErrorCodes {
	'CONTAINS_NULL_VALUES' = 2296,
	// @TODO extend with other errors
}

export function extractError(error: OracleError): OracleError | Error {
	switch (error.errorNum) {
		case OracleErrorCodes.CONTAINS_NULL_VALUES:
			return containsNullValues(error);
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
