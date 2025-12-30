import { GeometryHelper } from '../types.js';
import type { Field, RawField } from '@directus/types';
import type { Knex } from 'knex';
import type { GeoJSONGeometry } from 'wellknown';

export class GeometryHelperMSSQL extends GeometryHelper {
	override isTrue(expression: Knex.Raw) {
		return expression.wrap(``, ` = 1`);
	}

	override isFalse(expression: Knex.Raw) {
		return expression.wrap(``, ` = 0`);
	}

	override createColumn(table: Knex.CreateTableBuilder, field: RawField | Field) {
		if (field.type.split('.')[1]) {
			field.meta!.special = [field.type];
		}

		return table.specificType(field.field, 'geometry');
	}

	override asText(table: string, column: string, alias: string | false): Knex.Raw {
		if (alias) return this.knex.raw('??.??.STAsText() as ??', [table, column, alias]);
		return this.knex.raw('??.??.STAsText()', [table, column]);
	}

	override fromText(text: string): Knex.Raw {
		return this.knex.raw('geometry::STGeomFromText(?, 4326)', text);
	}

	override _intersects(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		const geometry = this.fromGeoJSON(geojson);
		return this.knex.raw('??.STIntersects(?)', [key, geometry]);
	}

	override _intersects_bbox(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		const geometry = this.fromGeoJSON(geojson);
		return this.knex.raw('??.STEnvelope().STIntersects(?.STEnvelope())', [key, geometry]);
	}

	override collect(table: string, column: string): Knex.Raw {
		return this.knex.raw('geometry::CollectionAggregate(??.??).STAsText()', [table, column]);
	}
}
