import { Field, RawField } from '../types/field';
import { Knex } from 'knex';

export function createGeometryColumn(
	knex: Knex,
	table: Knex.CreateTableBuilder,
	field: RawField | Field
): Knex.ColumnBuilder {
	const [, format = 'geojson', type = 'Point'] = field.meta?.special || [];
	const {
		config: { client },
	} = knex.client;
	switch (format) {
		case 'native':
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
					throw new Error(`Native geometric types not supported on ${client}.`);
				default:
					throw new Error(`Native geometric types not supported on ${client}.`);
			}
			break;
		case 'geojson':
			return table.json(field.field);
		case 'lnglat':
			return table.string(field.field);
		case 'wkt':
			return table.string(field.field);
		case 'wkb':
			return table.binary(field.field);
		default:
			throw new Error(`Invalid geometric storage type: ${format}`);
	}
}

export function queryGeometryAsText(knex: Knex, column: string): Knex.Raw {
	const {
		config: { client },
	} = knex.client;
	switch (client) {
		case 'pg':
		case 'mysql':
		case 'mariadb':
		case 'redshift':
		case 'sqlite3':
			return knex.raw('st_astext(??) as ??', [column, column]);
		case 'mssql':
			return knex.raw('??.STAsText() as ??', [column, column]);
		case 'oracledb':
			return knex.raw('sdo_util.from_wkbgeometry(??) as ??', [column, column]);
		default:
			throw new Error(`Native geometric types not supported on ${client}.`);
	}
}

export function queryGeometryFromText(knex: Knex, text: string): Knex.Raw {
	const {
		config: { client },
	} = knex.client;
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
