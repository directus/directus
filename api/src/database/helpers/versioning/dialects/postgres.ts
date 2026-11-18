import { VersioningHelper } from '../types.js';

const SIZED_NUMBER_TYPES = new Set(['smallint', 'int2', 'double precision', 'float8']);

export class VersioningHelperPostgres extends VersioningHelper {
	override getMaxIdentifierLength(): number {
		// Identifiers longer than NAMEDATALEN - 1 are silently truncated, CockroachDB matches this for compatibility
		// https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS
		return 63;
	}

	override isSizedNumberType(dataType: string): boolean {
		return SIZED_NUMBER_TYPES.has(dataType.toLowerCase());
	}
}
