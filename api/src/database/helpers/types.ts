import { Knex } from 'knex';

export type DatabaseClients = 'mysql' | 'postgres' | 'cockroachdb' | 'sqlite' | 'oracle' | 'mssql' | 'redshift';

export abstract class DatabaseHelper {
	constructor(protected knex: Knex) {}
}
