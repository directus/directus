import { KNEX_TYPES } from '@directus/shared/constants';
import { Field } from '@directus/shared/types';
import { Options, SchemaHelper } from '../types';

export class SchemaHelperCockroachDb extends SchemaHelper {
	async changeToType(
		table: string,
		column: string,
		type: typeof KNEX_TYPES[number],
		options: Options = {}
	): Promise<void> {
		await this.changeToTypeByCopy(table, column, type, options);
	}

	processField(field: Field): void {
		if (
			field.schema?.default_value &&
			['integer', 'bigInteger'].includes(field.type) &&
			typeof field.schema.default_value === 'string' &&
			field.schema.default_value.startsWith('nextval(')
		) {
			field.schema.has_auto_increment = true;
		}
	}
}
