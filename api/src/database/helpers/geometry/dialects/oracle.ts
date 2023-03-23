import type { Field, RawField } from '@directus/shared/types';
import type { Knex } from 'knex';
import type { GeoJSONGeometry } from 'wellknown';
import { GeometryHelper } from '../types';

export class GeometryHelperOracle extends GeometryHelper {
	isTrue(expression: Knex.Raw) {
		return expression.wrap(``, ` = 'TRUE'`);
	}
	isFalse(expression: Knex.Raw) {
		return expression.wrap(``, ` = 'FALSE'`);
	}
	createColumn(table: Knex.CreateTableBuilder, field: RawField | Field) {
		if (field.type.split('.')[1]) {
			field.meta!.special = [field.type];
		}
		return table.specificType(field.field, 'sdo_geometry');
	}
	asText(table: string, column: string): Knex.Raw {
		return this.knex.raw('sdo_util.to_wktgeometry(??.??) as ??', [table, column, column]);
	}
	asGeoJSON(table: string, column: string): Knex.Raw {
		return this.knex.raw('sdo_util.to_geojson(??.??) as ??', [table, column, column]);
	}
	fromText(text: string): Knex.Raw {
		return this.knex.raw('sdo_geometry(?, 4326)', text);
	}
	_intersects(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		const geometry = this.fromGeoJSON(geojson);
		return this.knex.raw(`sdo_overlapbdyintersect(??, ?)`, [key, geometry]);
	}
	_intersects_bbox(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		const geometry = this.fromGeoJSON(geojson);
		return this.knex.raw(`sdo_overlapbdyintersect(sdo_geom.sdo_mbr(??), sdo_geom.sdo_mbr(?))`, [key, geometry]);
	}
	collect(table: string, column: string): Knex.Raw {
		return this.knex.raw(`concat('geometrycollection(', listagg(?, ', '), ')'`, this.asText(table, column));
	}
}
