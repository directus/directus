import type { KNEX_TYPES } from '@directus/constants';
import type { Options } from '../types.js';
import { SchemaHelper } from '../types.js';

export class SchemaHelperCockroachDb extends SchemaHelper {
	override async changeToType(
		table: string,
		column: string,
		type: (typeof KNEX_TYPES)[number],
		options: Options = {}
	): Promise<void> {
		await this.changeToTypeByCopy(table, column, type, options);
	}

	override constraintName(existingName: string): string {
		const suffix = '_replaced';

		// CockroachDB does not allow for dropping/creating constraints with the same
		// name in a single transaction. reference issue #14873
		if (existingName.endsWith(suffix)) {
			return existingName.substring(0, existingName.length - suffix.length);
		} else {
			return existingName + suffix;
		}
	}
}
