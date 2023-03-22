import type { KNEX_TYPES } from '@directus/shared/constants';
import type { Field, Relation, Type } from '@directus/shared/types';
import { Options, SchemaHelper } from '../types';

export class SchemaHelperOracle extends SchemaHelper {
	async changeToType(
		table: string,
		column: string,
		type: (typeof KNEX_TYPES)[number],
		options: Options = {}
	): Promise<void> {
		await this.changeToTypeByCopy(table, column, type, options);
	}

	castA2oPrimaryKey(): string {
		return 'CAST(?? AS VARCHAR2(255))';
	}

	preRelationChange(relation: Partial<Relation>): void {
		if (relation.collection === relation.related_collection) {
			// Constraints are not allowed on self referencing relationships
			// Setting NO ACTION throws - ORA-00905: missing keyword
			if (relation.schema?.on_delete) {
				relation.schema.on_delete = null;
			}
		}
	}

	processFieldType(field: Field): Type {
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
}
