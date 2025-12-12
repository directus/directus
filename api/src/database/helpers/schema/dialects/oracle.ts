import type { KNEX_TYPES } from '@directus/constants';
import type { Column } from '@directus/schema';
import type { Field, RawField, Relation, Type } from '@directus/types';
import type { Knex } from 'knex';
import crypto from 'node:crypto';
import { getDefaultIndexName } from '../../../../utils/get-default-index-name.js';
import type { CreateIndexOptions, Options, SortRecord, Sql } from '../types.js';
import { SchemaHelper } from '../types.js';
import { prepQueryParams } from '../utils/prep-query-params.js';

export class SchemaHelperOracle extends SchemaHelper {
	override generateIndexName(
		type: 'unique' | 'foreign' | 'index',
		collection: string,
		fields: string | string[],
	): string {
		// Backwards compatibility with oracle requires no hash added to the name.
		let indexName = getDefaultIndexName(type, collection, fields, { maxLength: Infinity });

		// Knex generates a hash of the name if it is above the allowed value
		// https://github.com/knex/knex/blob/master/lib/dialects/oracle/utils.js#L20
		if (indexName.length > 128) {
			// generates the sha1 of the name and encode it with base64
			indexName = crypto.createHash('sha1').update(indexName).digest('base64').replace('=', '');
		}

		return indexName;
	}

	override async changeToType(
		table: string,
		column: string,
		type: (typeof KNEX_TYPES)[number],
		options: Options = {},
	): Promise<void> {
		await this.changeToTypeByCopy(table, column, type, options);
	}

	override castA2oPrimaryKey(): string {
		return 'CAST(?? AS VARCHAR2(255))';
	}

	override preRelationChange(relation: Partial<Relation>): void {
		if (relation.collection === relation.related_collection) {
			// Constraints are not allowed on self referencing relationships
			// Setting NO ACTION throws - ORA-00905: missing keyword
			if (relation.schema?.on_delete) {
				relation.schema.on_delete = null;
			}
		}
	}

	override processFieldType(field: Field): Type {
		if (field.type === 'integer') {
			if (field.schema?.numeric_precision === 20) {
				return 'bigInteger';
			} else if (field.schema?.numeric_precision === 1) {
				return 'boolean';
			} else if (field.schema?.numeric_precision || field.schema?.numeric_scale) {
				return 'decimal';
			}
		}

		return field.type;
	}

	override async getDatabaseSize(): Promise<number | null> {
		try {
			const result = await this.knex.raw('select SUM(bytes) from dba_segments');

			return result[0]?.['SUM(BYTES)'] ? Number(result[0]?.['SUM(BYTES)']) : null;
		} catch {
			return null;
		}
	}

	/**
	 * Oracle throws an error when overwriting the nullable option for an existing column with the same value.
	 */
	override setNullable(column: Knex.ColumnBuilder, field: RawField | Field, existing: Column | null): void {
		if (!existing) {
			super.setNullable(column, field, existing);

			return;
		}

		if (field.schema?.is_nullable === false && existing.is_nullable === true) {
			column.notNullable();
		} else if (field.schema?.is_nullable === true && existing.is_nullable === false) {
			column.nullable();
		}
	}

	override prepQueryParams(queryParams: Sql): Sql {
		return prepQueryParams(queryParams, { format: (index) => `:${index + 1}` });
	}

	override prepBindings(bindings: Knex.Value[]): any {
		// Create an object with keys 1, 2, 3, ... and the bindings as values
		// This will use the "named" binding syntax in the oracledb driver instead of the positional binding
		return Object.fromEntries(bindings.map((binding: any, index: number) => [index + 1, binding]));
	}

	override addInnerSortFieldsToGroupBy(
		groupByFields: (string | Knex.Raw)[],
		sortRecords: SortRecord[],
		_hasRelationalSort: boolean,
	) {
		/*
		Oracle requires all selected columns that are not aggregated over to be present in the GROUP BY clause
		aliases can not be used before version 23c.

		> If you also specify a group_by_clause in this statement, then this select list can contain only the following
			types of expressions:
				* Constants
				* Aggregate functions and the functions USER, UID, and SYSDATE
				* Expressions identical to those in the group_by_clause. If the group_by_clause is in a subquery,
					then all columns in the select list of the subquery must match the GROUP BY columns in the subquery.
					If the select list and GROUP BY columns of a top-level query or of a subquery do not match,
					then the statement results in ORA-00979.
				* Expressions involving the preceding expressions that evaluate to the same value for all rows in a group

		https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/SELECT.html
		 */

		if (sortRecords.length > 0) {
			groupByFields.push(...sortRecords.map(({ column }) => column));
		}
	}

	override getColumnNameMaxLength(): number {
		return 128;
	}

	override getTableNameMaxLength(): number {
		return 128;
	}

	override async createIndex(
		collection: string,
		field: string | string[],
		options: CreateIndexOptions = {},
	): Promise<Knex.SchemaBuilder> {
		const fields = Array.isArray(field) ? field : [field];
		const isUnique = Boolean(options.unique);
		const constraintName = this.generateIndexName(isUnique ? 'unique' : 'index', collection, fields);
		const placeholders = fields.map(() => '??').join(', ');

		if (options.attemptConcurrentIndex) {
			// https://docs.oracle.com/en/database/oracle/oracle-database/21/sqlrf/CREATE-INDEX.html#GUID-1F89BBC0-825F-4215-AF71-7588E31D8BFE__GUID-041E5429-065B-43D5-AC7F-66810140842C
			return this.knex.raw(`CREATE ${isUnique ? 'UNIQUE ' : ''}INDEX ?? ON ?? (${placeholders}) ONLINE`, [
				constraintName,
				collection,
				...fields,
			]);
		}

		return this.knex.raw(`CREATE ${isUnique ? 'UNIQUE ' : ''}INDEX ?? ON ?? (${placeholders})`, [
			constraintName,
			collection,
			...fields,
		]);
	}
}
