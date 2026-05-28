import knex, { type Knex } from 'knex';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { up as addMcpOAuth } from './20260512B-add-mcp-oauth.js';
import { down, up } from './20260527A-add-mcp-oauth-private-key-jwt.js';

describe('20260527A-add-mcp-oauth-private-key-jwt', () => {
	let db: Knex;

	beforeEach(async () => {
		db = knex({
			client: 'sqlite3',
			connection: {
				filename: ':memory:',
			},
			useNullAsDefault: true,
		});

		await db.raw('PRAGMA foreign_keys = ON');

		await db.schema.createTable('directus_settings', (table) => {
			table.increments('id').primary();
		});

		await db.schema.createTable('directus_users', (table) => {
			table.uuid('id').primary().notNullable();
		});

		await db.schema.createTable('directus_sessions', (table) => {
			table.string('token', 64).primary().notNullable();
		});

		await addMcpOAuth(db);
	});

	afterEach(async () => {
		await db.destroy();
	});

	test('adds private_key_jwt client columns and replay assertion table metadata', async () => {
		await up(db);

		const clientColumns = await db.table('directus_oauth_clients').columnInfo();

		expect(clientColumns['jwks_uri']).toMatchObject({
			type: 'varchar',
			nullable: true,
			maxLength: '255',
		});

		expect(clientColumns['token_endpoint_auth_signing_alg']).toMatchObject({
			type: 'varchar',
			nullable: true,
			maxLength: '255',
		});

		const assertionColumns = await db.table('directus_oauth_client_assertions').columnInfo();

		expect(assertionColumns['jti_hash']).toMatchObject({
			type: 'varchar',
			nullable: false,
			maxLength: '64',
		});

		expect(assertionColumns['client']).toMatchObject({
			type: 'varchar',
			nullable: false,
			maxLength: '255',
		});

		expect(assertionColumns['expires_at']).toMatchObject({
			type: 'datetime',
			nullable: false,
		});

		const indexes = await getIndexes(db, 'directus_oauth_client_assertions');

		expect(indexes).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ columns: ['jti_hash'], unique: true }),
				expect.objectContaining({ columns: ['client'], unique: false }),
				expect.objectContaining({ columns: ['expires_at'], unique: false }),
			]),
		);

		await expect(getPrimaryKeyColumns(db, 'directus_oauth_client_assertions')).resolves.toEqual(['jti_hash']);

		const foreignKeys = await db.raw('PRAGMA foreign_key_list("directus_oauth_client_assertions")');

		expect(foreignKeys).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					from: 'client',
					table: 'directus_oauth_clients',
					to: 'client_id',
					on_delete: 'CASCADE',
				}),
			]),
		);
	});

	test('cascades assertion rows when an OAuth client is deleted', async () => {
		await up(db);

		await db('directus_oauth_clients').insert({
			client_id: 'client-a',
			client_name: 'Client A',
			redirect_uris: JSON.stringify(['https://example.com/callback']),
			grant_types: JSON.stringify(['authorization_code']),
			date_created: new Date(),
		});

		await db('directus_oauth_client_assertions').insert({
			jti_hash: 'a'.repeat(64),
			client: 'client-a',
			expires_at: new Date(Date.now() + 60_000),
		});

		await db('directus_oauth_clients').where({ client_id: 'client-a' }).delete();

		await expect(db('directus_oauth_client_assertions')).resolves.toHaveLength(0);
	});

	test('drops assertion table before removing private_key_jwt client columns', async () => {
		await up(db);
		await down(db);

		await expect(db.schema.hasTable('directus_oauth_client_assertions')).resolves.toBe(false);

		const clientColumns = await db.table('directus_oauth_clients').columnInfo();

		expect(clientColumns['jwks_uri']).toBeUndefined();
		expect(clientColumns['token_endpoint_auth_signing_alg']).toBeUndefined();
	});
});

async function getPrimaryKeyColumns(db: Knex, table: string) {
	const tableInfo = (await db.raw(`PRAGMA table_info("${table}")`)) as Array<{ name: string; pk: number }>;

	return tableInfo
		.filter((column) => column.pk > 0)
		.sort((a, b) => a.pk - b.pk)
		.map((column) => column.name);
}

async function getIndexes(db: Knex, table: string) {
	const indexList = (await db.raw(`PRAGMA index_list("${table}")`)) as Array<{ name: string; unique: number }>;

	return Promise.all(
		indexList.map(async (index) => {
			const columns = (await db.raw(`PRAGMA index_info("${index.name}")`)) as Array<{ name: string }>;

			return {
				name: index.name,
				unique: index.unique === 1,
				columns: columns.map((column) => column.name),
			};
		}),
	);
}
