import type { KNEX_TYPES } from '@directus/constants';
import type { Field, Relation, Type } from '@directus/types';
import type { Knex } from 'knex';
import type { Options, SortRecord, Sql } from '../types.js';
import { SchemaHelper } from '../types.js';
import { preprocessBindings } from '../utils/preprocess-bindings.js';

export class SchemaHelperOracle extends SchemaHelper {
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

	override preprocessBindings(queryParams: Sql): Sql {
		return preprocessBindings(queryParams, { format: (index) => `:${index + 1}` });
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
}
