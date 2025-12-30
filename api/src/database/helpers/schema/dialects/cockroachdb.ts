import type { CreateIndexOptions, Options, SortRecord } from '../types.js';
import { SchemaHelper } from '../types.js';
import type { KNEX_TYPES } from '@directus/constants';
import { useEnv } from '@directus/env';
import { type Knex } from 'knex';

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

	override addInnerSortFieldsToGroupBy(
		groupByFields: (string | Knex.Raw)[],
		sortRecords: SortRecord[],
		hasRelationalSort: boolean,
	) {
		if (hasRelationalSort) {
			/*
			Cockroach allows aliases to be used in the GROUP BY clause and only needs columns in the GROUP BY clause that
			are not functionally dependent on the primary key.

			> You can group columns by an alias (i.e., a label assigned to the column with an AS clause) rather than the column name.

			> If aggregate groups are created on a full primary key, any column in the table can be selected as a target_elem,
			  or specified in a HAVING clause.

			https://www.cockroachlabs.com/docs/stable/select-clause#parameters
			 */

			groupByFields.push(...sortRecords.map(({ alias }) => alias));
		}
	}

	override async createIndex(
		collection: string,
		field: string,
		options: CreateIndexOptions = {},
	): Promise<Knex.SchemaBuilder> {
		const isUnique = Boolean(options.unique);
		const constraintName = this.generateIndexName(isUnique ? 'unique' : 'index', collection, field);

		// https://www.cockroachlabs.com/docs/stable/create-index
		if (options.attemptConcurrentIndex) {
			return this.knex.raw(`CREATE ${isUnique ? 'UNIQUE ' : ''}INDEX CONCURRENTLY ?? ON ?? (??)`, [
				constraintName,
				collection,
				field,
			]);
		}

		return this.knex.raw(`CREATE ${isUnique ? 'UNIQUE ' : ''}INDEX ?? ON ?? (??)`, [constraintName, collection, field]);
	}
}
