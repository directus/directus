import { KNEX_TYPES } from '@directus/shared/constants';
import { Field } from '@directus/shared/types';
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

	processField(field: Field): void {
		if (field.type === 'integer') {
			if (field.schema?.numeric_precision === 20) {
				field.type = 'bigInteger';
			} else if (field.schema?.numeric_precision === 1) {
				field.type = 'boolean';
			} else if (field.schema?.numeric_precision || field.schema?.numeric_scale) {
				field.type = 'decimal';
			}
		}
	}
}
