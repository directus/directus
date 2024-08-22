import type { Knex } from 'knex';
import { DatabaseHelper } from '../types.js';
import type { Column } from '@directus/schema';
import type { Field, RawField } from '@directus/types';

export class NullableFieldUpdateHelper extends DatabaseHelper {
	updateNullableValue(column: Knex.ColumnBuilder, field: RawField | Field, existing: Column): void {
		// for an existing item: if nullable option changed, we have to provide the default values as well and actually vice versa
		// see https://knexjs.org/guide/schema-builder.html#alter

		const isNullable = field.schema?.is_nullable ?? existing?.is_nullable ?? true;

		if (isNullable) {
			column.nullable();
		} else {
			column.notNullable();
		}
	}
}
