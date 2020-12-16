import Knex from 'knex';
import { SchemaConstructor } from './types/schema';

export default function Schema(knex: Knex) {
	let constructor: SchemaConstructor;

	switch (knex.client.constructor.name) {
		case 'Client_MySQL':
			constructor = require('./dialects/mysql').default;
			break;
		case 'Client_PG':
			constructor = require('./dialects/postgres').default;
			break;
		case 'Client_SQLite3':
			constructor = require('./dialects/sqlite').default;
			break;
		case 'Client_Oracledb':
		case 'Client_Oracle':
			constructor = require('./dialects/oracledb').default;
			break;
		case 'Client_MSSQL':
			constructor = require('./dialects/mssql').default;
			break;

		default:
			throw Error('Unsupported driver used: ' + knex.client.constructor.name);
	}

	return new constructor(knex);
}
