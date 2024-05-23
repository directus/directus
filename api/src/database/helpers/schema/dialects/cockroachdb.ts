import type { KNEX_TYPES } from '@directus/constants';
import type { Options } from '../types.js';
import { SchemaHelper } from '../types.js';
import { useEnv } from '@directus/env';

const env = useEnv();

export class SchemaHelperCockroachDb extends SchemaHelper {
	override async changeToType(
		table: string,
		column: string,
		type: (typeof KNEX_TYPES)[number],
		options: Options = {},
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

	override async getDatabaseSize(): Promise<number | null> {
		try {
			const result = await this.knex
				.select(this.knex.raw('round(SUM(range_size_mb) * 1024 * 1024, 0) AS size'))
				.from(this.knex.raw('[SHOW RANGES FROM database ??]', [env['DB_DATABASE']]));

			return result[0]?.['size'] ? Number(result[0]?.['size']) : null;
		} catch {
			return null;
		}
	}
}
