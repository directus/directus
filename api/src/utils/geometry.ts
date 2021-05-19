import { Field, RawField } from '../types/field';
import { Knex } from 'knex';

export function createGeometryColumn(
	knex: Knex,
	table: Knex.CreateTableBuilder,
	field: RawField | Field
): Knex.ColumnBuilder {
	const type = field.schema?.geometry_type || 'geometry';
	const client = knex.client.config.client;
	switch (client) {
		case 'mysql':
		case 'mariadb':
			return table.specificType(field.field, type);
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
			// This works too, but it's not an *actual* geometry column to Spatialite
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
			return knex.raw('sdo_util.from_wkbgeometry(:table:.:column:) as :column:', { table, column });
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
