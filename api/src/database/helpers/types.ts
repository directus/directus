import type { Knex } from 'knex';

export abstract class DatabaseHelper {
	constructor(protected knex: Knex) {}
}
