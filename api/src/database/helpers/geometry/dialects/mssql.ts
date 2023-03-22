import type { Field, RawField } from '@directus/shared/types';
import type { Knex } from 'knex';
import type { GeoJSONGeometry } from 'wellknown';
import { GeometryHelper } from '../types';

export class GeometryHelperMSSQL extends GeometryHelper {
	isTrue(expression: Knex.Raw) {
		return expression.wrap(``, ` = 1`);
	}
	isFalse(expression: Knex.Raw) {
		return expression.wrap(``, ` = 0`);
	}
	createColumn(table: Knex.CreateTableBuilder, field: RawField | Field) {
		if (field.type.split('.')[1]) {
			field.meta!.special = [field.type];
		}
		return table.specificType(field.field, 'geometry');
	}
	asText(table: string, column: string): Knex.Raw {
		return this.knex.raw('??.??.STAsText() as ??', [table, column, column]);
	}
	fromText(text: string): Knex.Raw {
		return this.knex.raw('geometry::STGeomFromText(?, 4326)', text);
	}
	_intersects(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		const geometry = this.fromGeoJSON(geojson);
		return this.knex.raw('??.STIntersects(?)', [key, geometry]);
	}
	_intersects_bbox(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		const geometry = this.fromGeoJSON(geojson);
		return this.knex.raw('??.STEnvelope().STIntersects(?.STEnvelope())', [key, geometry]);
	}
	collect(table: string, column: string): Knex.Raw {
		return this.knex.raw('geometry::CollectionAggregate(??.??).STAsText()', [table, column]);
	}
}
