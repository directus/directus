import { KNEX_TYPES } from '@directus/shared/constants';
import { Field, Type } from '@directus/shared/types';
import { Options, SchemaHelper } from '../types';

export class SchemaHelperOracle extends SchemaHelper {
	async changeToType(
		table: string,
		column: string,
		type: typeof KNEX_TYPES[number],
		options: Options = {}
	): Promise<void> {
		await this.changeToTypeByCopy(table, column, type, options);
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
