import { DatabaseHelper } from '../types.js';

export class CapabilitiesHelper extends DatabaseHelper {
	supportsColumnPositionInGroupBy(): boolean {
		return false;
	}

	/**
	 * Indicates if the values within the list of parameters can be safely deduplicated.
	 * This is useful for databases that do not automatically cast the value for cases when a parameter is referenced multiple times in the query,
	 * but the targeting type is different. For example when referencing a parameter which a UUID, postgres cannot use the same parameter reference
	 * to compare it against column of type UUID and at the same time against a column of type a string.
	 */
	supportsDeduplicationOfParameters(): boolean {
		return true;
	}
}
