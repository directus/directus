import { GeometryHelper } from '../types.js';
import type { Field, RawField } from '@directus/types';
import type { Knex } from 'knex';

export class GeometryHelperRedshift extends GeometryHelper {
	override createColumn(table: Knex.CreateTableBuilder, field: RawField | Field) {
		if (field.type.split('.')[1]) {
			field.meta!.special = [field.type];
		}

		return table.specificType(field.field, 'geometry');
	}

	asGeoJSON(table: string, column: string): Knex.Raw {
		return this.knex.raw('st_asgeojson(??.??) as ??', [table, column, column]);
	}
}
