import { Field, RawField } from '../../types';
import { Knex } from 'knex';
import { stringify as geojsonToWKT, GeoJSONGeometry } from 'wellknown';
import getDatabase from '..';

let geometryHelper: KnexSpatial | undefined;

export function getGeometryHelper(): KnexSpatial {
	if (!geometryHelper) {
		const db = getDatabase();
		const client = db.client.config.client as string;
		const constructor = {
			mysql: KnexSpatial,
			mariadb: KnexSpatial,
			sqlite3: KnexSpatial,
			pg: KnexSpatial_PG,
			redshift: KnexSpatial_Redshift,
			mssql: KnexSpatial_MSSQL,
			oracledb: KnexSpatial_Oracle,
		}[client];
		if (!constructor) {
			throw new Error(`Geometry helper not implemented on ${client}.`);
		}
		geometryHelper = new constructor(db);
	}
	return geometryHelper;
}

class KnexSpatial {
	constructor(protected knex: Knex) {}
	createColumn(table: Knex.CreateTableBuilder, field: RawField | Field) {
		const type = field.schema?.geometry_type ?? 'geometry';
		return table.specificType(field.field, type);
	}
	asText(table: string, column: string): Knex.Raw {
		return this.knex.raw('st_astext(:table:.:column:) as :column:', { table, column });
	}
	fromText(text: string): Knex.Raw {
		return this.knex.raw('st_geomfromtext(?, 4326)', text);
	}
	fromGeoJSON(geojson: GeoJSONGeometry): Knex.Raw {
		return this.fromText(geojsonToWKT(geojson));
	}
	intersects(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		const geometry = this.fromGeoJSON(geojson);
		return this.knex.raw('st_intersects(??, ?)', [key, geometry]);
	}
	nintersects(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		return this.intersects(key, geojson).wrap('NOT ', '');
	}
	intersects_bbox(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		const geometry = this.fromGeoJSON(geojson);
		return this.knex.raw('intersects(??, ?)', [key, geometry]);
	}
	nintersects_bbox(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		return this.intersects_bbox(key, geojson).wrap('NOT ', '');
	}
}

class KnexSpatial_PG extends KnexSpatial {
	createColumn(table: Knex.CreateTableBuilder, field: RawField | Field) {
		const type = field.schema?.geometry_type ?? 'geometry';
		return table.specificType(field.field, `geometry(${type})`);
	}
	intersects_bbox(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		const geometry = this.fromGeoJSON(geojson);
		return this.knex.raw('?? && ?', [key, geometry]);
	}
}

class KnexSpatial_Redshift extends KnexSpatial {
	createColumn(table: Knex.CreateTableBuilder, field: RawField | Field) {
		const type = field.schema?.geometry_type ?? 'geometry';
		if (type !== 'geometry') field.meta!.special![1] = type;
		return table.specificType(field.field, 'geometry');
	}
}

class KnexSpatial_MSSQL extends KnexSpatial {
	createColumn(table: Knex.CreateTableBuilder, field: RawField | Field) {
		const type = field.schema?.geometry_type ?? 'geometry';
		if (type !== 'geometry') field.meta!.special![1] = type;
		return table.specificType(field.field, 'geometry');
	}
	asText(table: string, column: string): Knex.Raw {
		return this.knex.raw(':table:.:column:.STAsText() as :column:', { table, column });
	}
	fromText(text: string): Knex.Raw {
		return this.knex.raw('geometry::STGeomFromText(?, 4326)', text);
	}
	isTrue(expression: Knex.Raw) {
		return expression.wrap(``, ` = 1`);
	}
	isFalse(expression: Knex.Raw) {
		return expression.wrap(``, ` = 0`);
	}
	_intersects(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		const geometry = this.fromGeoJSON(geojson);
		return this.knex.raw('??.STIntersects(?)', [key, geometry]);
	}
	intersects(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		return this.isTrue(this.intersects(key, geojson));
	}
	nintersects(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		return this.isFalse(this.intersects(key, geojson));
	}
	_intersects_bbox(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		const geometry = this.fromGeoJSON(geojson);
		return this.knex.raw('??.STEnvelope().STIntersects(?.STEnvelope())', [key, geometry]);
	}
	intersects_bbox(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		return this.isTrue(this.intersects(key, geojson));
	}
	nintersects_bbox(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		return this.isFalse(this.intersects(key, geojson));
	}
}

class KnexSpatial_Oracle extends KnexSpatial {
	createColumn(table: Knex.CreateTableBuilder, field: RawField | Field) {
		const type = field.schema?.geometry_type ?? 'geometry';
		if (type !== 'geometry') field.meta!.special![1] = type;
		return table.specificType(field.field, 'sdo_geometry');
	}
	asText(table: string, column: string): Knex.Raw {
		return this.knex.raw('sdo_util.from_wktgeometry(:table:.:column:) as :column:', { table, column });
	}
	fromText(text: string): Knex.Raw {
		return this.knex.raw('sdo_geometry(?, 4326)', text);
	}
	isTrue(expression: Knex.Raw) {
		return expression.wrap(``, ` = 'TRUE'`);
	}
	isFalse(expression: Knex.Raw) {
		return expression.wrap(``, ` = 'FALSE'`);
	}
	_intersects(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		const geometry = this.fromGeoJSON(geojson);
		return this.knex.raw(`sdo_overlapbdyintersect(??, ?)`, [key, geometry]);
	}
	intersects(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		return this.isTrue(this.intersects(key, geojson));
	}
	nintersects(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		return this.isFalse(this.intersects(key, geojson));
	}
	_intersects_bbox(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		const geometry = this.fromGeoJSON(geojson);
		return this.knex.raw(`sdo_overlapbdyintersect(sdo_geom.sdo_mbr(??), sdo_geom.sdo_mbr(?))`, [key, geometry]);
	}
	intersects_bbox(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		return this.isTrue(this._intersects_bbox(key, geojson));
	}
	nintersects_bbox(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		return this.isFalse(this._intersects_bbox(key, geojson));
	}
}
