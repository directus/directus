import assert from 'node:assert';
import type { KNEX_TYPES } from '@directus/constants';
import { useEnv } from '@directus/env';
import { toArray } from '@directus/utils';
import { type Knex } from 'knex';
import { transaction } from '../../../../utils/transaction.js';
import type { CreateIndexOptions, Options, SortRecord } from '../types.js';
import { SchemaHelper } from '../types.js';

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

	override async changePrimaryKey(table: string, to: string | string[]): Promise<void> {
		const primaryColumns = toArray(to);
		const placeholders = primaryColumns.map(() => '??').join(', ');

		assert(primaryColumns.length > 0, 'At least 1 "to" column is required');
		assert(primaryColumns[0] && primaryColumns[0].length > 0, '"to" column cannot be empty');

		/* Before adding the new PK field(s) we drop the existing constraint to ensure no leftover secondary index on the original PK field.
		 * - https://www.cockroachlabs.com/docs/stable/primary-key#changing-primary-key-columns
		 *
		 * CockroachDB requires that when changing a PK the current one be dropped and new one added in the same transaction.
		 * To prevent this error from being thrown both operations are executed in the same statement via `,`.
		 * - https://www.cockroachlabs.com/docs/stable/primary-key.html
		 * - https://www.cockroachlabs.com/docs/stable/alter-table#synopsis
		 */

		await transaction(this.knex, async (trx) => {
			await trx.raw(`ALTER TABLE ?? DROP CONSTRAINT ?? , ADD CONSTRAINT ?? PRIMARY KEY (${placeholders})`, [
				table,
				`${table}_pkey`,
				`${table}_pkey`,
				...primaryColumns,
			]);
		});
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
