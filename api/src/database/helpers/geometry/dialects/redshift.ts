import { GeometryHelper } from '../types';
import { Field, RawField } from '@directus/shared/types';
import { Knex } from 'knex';

export class GeometryHelperRedshift extends GeometryHelper {
	createColumn(table: Knex.CreateTableBuilder, field: RawField | Field) {
		if (field.type.split('.')[1]) {
			field.meta!.special = [field.type];
		}
		return table.specificType(field.field, 'geometry');
	}
	asGeoJSON(table: string, column: string): Knex.Raw {
		return this.knex.raw('st_asgeojson(??.??) as ??', [table, column, column]);
	}
}
