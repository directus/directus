import { Field, RawField } from '../../types';
import { Knex } from 'knex';
import { stringify as geojsonToWKT, GeoJSONGeometry } from 'wellknown';
import getDatabase from '..';

export function getGeometryHelper(): KnexSpatial {
	const db = getDatabase();
	const client = db.client.config.client;
	switch (client) {
		case 'mysql':
		case 'mariadb':
		case 'sqlite3':
			return new KnexSpatial(db);
		case 'pg':
			return new KnexSpatial_PG(db);
		case 'redshift':
			return new KnexSpatial_Redshift(db);
		case 'mssql':
			return new KnexSpatial_MSSQL(db);
		case 'oracledb':
			return new KnexSpatial_Oracle(db);
		default:
			throw new Error(`Geometry helper not implemented on ${client}.`);
	}
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
}

class KnexSpatial_PG extends KnexSpatial {
	createColumn(table: Knex.CreateTableBuilder, field: RawField | Field) {
		const type = field.schema?.geometry_type ?? 'geometry';
		return table.specificType(field.field, `geometry(${type})`);
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
	intersects(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		const geometry = this.fromGeoJSON(geojson);
		return this.knex.raw('??.STIntersects(?) = 1', [key, geometry]);
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
	intersects(key: string, geojson: GeoJSONGeometry): Knex.Raw {
		const geometry = this.fromGeoJSON(geojson);
		return this.knex.raw(`sdo_relate(??, ?, 'mask=overlapbdyintersect') = 'TRUE'`, [key, geometry]);
	}
}
