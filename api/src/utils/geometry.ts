import { Field, FieldOverview, RawField } from '../types';
import { Knex } from 'knex';

export function createGeometryColumn(
	knex: Knex,
	table: Knex.CreateTableBuilder,
	field: RawField | Field
): Knex.ColumnBuilder {
	const type = field.schema?.geometry_type ?? 'geometry';
	const client = knex.client.config.client;
	switch (client) {
		case 'mysql':
		case 'mariadb':
		case 'sqlite3':
			return table.specificType(field.field, type);
		case 'pg':
			return table.specificType(field.field, `geometry(${type})`);
		case 'oracledb':
			if (type !== 'geometry') field.meta!.special![1] = type;
			return table.specificType(field.field, 'sdo_geometry');
		case 'mssql':
		case 'redshift':
			if (type !== 'geometry') field.meta!.special![1] = type;
			return table.specificType(field.field, 'geometry');
		default:
			throw new Error(`Native geometric types not supported on ${client}.`);
	}
}

export function queryGeometryAsText(knex: Knex, table: string, column: string): Knex.Raw {
	const client = knex.client.config.client;
	switch (client) {
		case 'pg':
		case 'mysql':
		case 'mariadb':
		case 'redshift':
		case 'sqlite3':
			return knex.raw('st_astext(:table:.:column:) as :column:', { table, column });
		case 'mssql':
			return knex.raw(':table:.:column:.STAsText() as :column:', { table, column });
		case 'oracledb':
			return knex.raw('sdo_util.from_wktgeometry(:table:.:column:) as :column:', { table, column });
		default:
			throw new Error(`Native geometric types not supported on ${client}.`);
	}
}

export function queryGeometryFromText(knex: Knex, text: string): Knex.Raw {
	const client = knex.client.config.client;
	switch (client) {
		case 'mysql':
		case 'mariadb':
		case 'redshift':
		case 'sqlite3':
		case 'pg':
			return knex.raw('st_geomfromtext(?, 4326)', text);
		case 'mssql':
			return knex.raw('geometry::STGeomFromText(?, 4326)', text);
		case 'oracledb':
			return knex.raw('sdo_geometry(?, 4326)', text);
		default:
			throw new Error(`Native geometric types not supported on ${client}.`);
	}
}

export function filterGeometryWithin(knex: Knex): Knex.Raw {
	const client = knex.client.config.client;
	switch (client) {
		case 'mysql':
		case 'mariadb':
		case 'redshift':
		case 'sqlite3':
		case 'pg':
		case 'mssql':
		case 'oracledb':
		default:
			throw new Error(`Not implemented`);
	}
}

const dbGeometricTypes = new Set([
	'point',
	'polygon',
	'linestring',
	'multipoint',
	'multipolygon',
	'multilinestring',
	'geometry',
	'geometrycollection',
	'sdo_geometry',
	'user-defined',
]);

export function isNativeGeometry(field: FieldOverview): boolean {
	const { type, dbType } = field;
	return type == 'geometry' && dbGeometricTypes.has(dbType!.toLowerCase());
}
