import type { Knex } from 'knex';
import { NullableFieldUpdateHelper } from '../types.js';
import type { Column } from '@directus/schema';
import type { Field, RawField } from '@directus/types';

/**
 * Oracle fail when overwriting the nullable option with same value.
 * Therefore we need to check if the nullable option has changed and only then apply it.
 * The default value can be set regardless auf the previous value.  @TODO double check
 */
export class NullableFieldUpdateHelperOracle extends NullableFieldUpdateHelper {
	override updateNullableValue(column: Knex.ColumnBuilder, field: RawField | Field, existing: Column): void {
		if (field.schema?.is_nullable === false && existing.is_nullable === true) {
			column.notNullable();
		} else if (field.schema?.is_nullable === true && existing.is_nullable === false) {
			column.nullable();
		}
	}
}
