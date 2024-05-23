import type { KNEX_TYPES } from '@directus/constants';
import type { Field, Relation, Type } from '@directus/types';
import type { Options } from '../types.js';
import { SchemaHelper } from '../types.js';

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
}
