import { GEOMETRY_TYPES } from '@directus/constants';
import type { Field, RawField } from '@directus/types';
import type { Knex } from 'knex';
import type { GeoJSONGeometry } from 'wellknown';
import { stringify as geojsonToWKT } from 'wellknown';
import { DatabaseHelper } from '../types.js';

export abstract class GeometryHelper extends DatabaseHelper {
	supported(): boolean | Promise<boolean> {
		return true;
	}

	/**
	 * Extract the geometry subtype from a field's type
	 *
	 * @return geometry subtype if found
	 */
	protected geometrySubtype(field: RawField | Field) {
		const subtype = field.type.split('.')[1];

		if (!subtype) return null;

		const type = GEOMETRY_TYPES.find((value) => value.toLowerCase() === subtype.toLowerCase());

		return type || null;
	}

	isTrue(expression: Knex.Raw) {
		return expression;
	}

	isFalse(expression: Knex.Raw) {
		return expression.wrap('NOT ', '');
	}

	createColumn(table: Knex.CreateTableBuilder, field: RawField | Field) {
		const type = this.geometrySubtype(field) ?? 'geometry';
		return table.specificType(field.field, type);
	}

	asText(table: string, column: string, alias: string | false): Knex.Raw {
		if (alias) return this.knex.raw('st_astext(??.??) as ??', [table, column, alias]);
		return this.knex.raw('st_astext(??.??)', [table, column]);
	}

	fromText(text: string): Knex.Raw {
		return this.knex.raw('st_geomfromtext(?, 4326)', text);
	}

	fromGeoJSON(geojson: GeoJSONGeometry): Knex.Raw {
		return this.fromText(geojsonToWKT(geojson));
	}

	_intersects(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		const geometry = this.fromGeoJSON(geojson);
		return this.knex.raw('st_intersects(??, ?)', [key, geometry]);
	}

	intersects(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		return this.isTrue(this._intersects(key, geojson));
	}

	nintersects(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		return this.isFalse(this._intersects(key, geojson));
	}

	_intersects_bbox(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		const geometry = this.fromGeoJSON(geojson);
		return this.knex.raw('st_intersects(??, ?)', [key, geometry]);
	}

	intersects_bbox(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		return this.isTrue(this._intersects_bbox(key, geojson));
	}

	nintersects_bbox(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		return this.isFalse(this._intersects_bbox(key, geojson));
	}

	collect(table: string, column: string): Knex.Raw {
		return this.knex.raw('st_astext(st_collect(??.??))', [table, column]);
	}
}
