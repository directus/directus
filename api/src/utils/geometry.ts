import { Field, FieldOverview, RawField } from '../types';
import { Knex } from 'knex';

export function createGeometryColumn(
	knex: Knex,
	table: Knex.CreateTableBuilder,
	field: RawField | Field
): Knex.ColumnBuilder {
	const format = field.schema?.geometry_format;
	switch (format) {
		case 'native':
			break;
		case 'geojson':
			return table.json(field.field);
		case 'wkb':
			return table.binary(field.field);
		case 'wkt':
		case 'lnglat':
			return table.string(field.field);
		default:
			throw new Error(`Unknown geometry format: ${format}.`);
	}
	const type = field.schema?.geometry_type || 'geometry';
	const client = knex.client.config.client;
	switch (client) {
		case 'mysql':
		case 'mariadb':
			return table.specificType(field.field, type);
		case 'pg':
			return table.specificType(field.field, `geometry(${type})`);
		case 'oracledb':
			return table.specificType(field.field, 'sdo_geometry');
		case 'mssql':
		case 'redshift':
			return table.specificType(field.field, 'geometry');
		case 'sqlite3':
			// Not sure how to deal with this ?
			// return knex.raw(`select AddGeometryColumnfield(??, ??, 4326, ?, 'XY')`, (table as any)._tableName, field.field, type);
			// This works too, but it won't be added to the geometry_columns schema (maybe there are other difference ?)
			return table.specificType(field.field, type);
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
			return knex.raw('st_geomfromtext(?)', text);
		case 'pg':
		case 'mssql':
			return knex.raw('?', text);
		case 'oracledb':
			return knex.raw('sdo_geometry(?)', text);
		default:
			throw new Error(`Native geometric types not supported on ${client}.`);
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

// Might be usefull somehow if we can pass that information to the client ?
// export async function geometrySupport(knex: Knex) {
// 	const client = knex.client.config.client;
// 	switch (client) {
// 		case 'mysql':
// 			const version = await knex.select(knex.raw('version()'));
// 			return { types: true, srid: Number(version[0]) >= 8 };
// 		case 'mariadb':
// 			return { types: true, srid: false };
// 		case 'mssql':
// 		case 'redshift':
// 		case 'oracledb':
// 			return { types: false, srid: false };
// 		case 'sqlite3':
// 			try {
// 				await knex.select(knex.raw('spatialite_version()'))
// 				return { types: true, srid: true };
// 			} catch(error) {
// 				return undefined;
// 			}
// 		case 'pg':
// 			try {
// 				await knex.select(knex.raw('postgis_version()'))
// 				return { types: true, srid: true };
// 			} catch(error) {
// 				return undefined;
// 			}
// 		default:
// 			return undefined;
// 	}
// }
