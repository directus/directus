import { Knex } from 'knex';

export async function oracleForceAlterColumn(knex: Knex, table: string, column: string, type: string): Promise<void> {
	await knex.raw(`ALTER TABLE "${table}" ADD "${column}__temp" ${type}`);
	await knex.raw(`UPDATE "${table}" SET "${column}__temp"="${column}"`);
	await knex.raw(`ALTER TABLE "${table}" DROP COLUMN "${column}"`);
	await knex.raw(`ALTER TABLE "${table}" RENAME COLUMN "${column}__temp" TO "${column}"`);
	await knex.raw(`ALTER TABLE "${table}" MODIFY "${column}" NOT NULL`);
}
