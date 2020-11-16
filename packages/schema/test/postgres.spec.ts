import Knex from 'knex';
import { expect } from 'chai';
import schema from '../src';
import { Schema } from '../src/types/schema-inspector';

describe('postgres-no-search-path', () => {
	let database: Knex;
	let inspector: Schema;

	before(() => {
		database = Knex({
			client: 'pg',
			connection: {
				host: '127.0.0.1',
				port: 5101,
				user: 'postgres',
				password: 'secret',
				database: 'test_db',
				charset: 'utf8',
			},
		});
		inspector = schema(database);
	});

	after(async () => {
		await database.destroy();
	});

	describe('.tables', () => {
		it('returns tables', async () => {
			expect(await inspector.tables()).to.deep.equal(['teams', 'users', 'page_visits']);
		});
	});

	describe('.tableInfo', () => {
		it('returns information for all tables', async () => {
			expect(await inspector.tableInfo()).to.deep.equal([
				{ name: 'page_visits', schema: 'public', comment: null },
				{ name: 'teams', schema: 'public', comment: null },
				{ name: 'users', schema: 'public', comment: null },
			]);
		});

		it('returns information for specific table', async () => {
			expect(await inspector.tableInfo('teams')).to.deep.equal({
				comment: null,
				name: 'teams',
				schema: 'public',
			});
		});
	});

	describe('.hasTable', () => {
		it('returns if table exists or not', async () => {
			expect(await inspector.hasTable('teams')).to.equal(true);
			expect(await inspector.hasTable('foobar')).to.equal(false);
		});
	});

	describe('.columns', () => {
		it('returns information for all tables', async () => {
			database.transaction(async (trx) => {
				expect(await schema(trx).columns()).to.deep.equal([
					{ table: 'page_visits', column: 'user_agent' },
					{ table: 'teams', column: 'name' },
					{ table: 'teams', column: 'created_at' },
					{ table: 'users', column: 'team_id' },
					{ table: 'users', column: 'id' },
					{ table: 'users', column: 'password' },
					{ table: 'teams', column: 'activated_at' },
					{ table: 'users', column: 'email' },
					{ table: 'teams', column: 'credits' },
					{ table: 'page_visits', column: 'created_at' },
					{ table: 'teams', column: 'id' },
					{ table: 'teams', column: 'description' },
					{ table: 'page_visits', column: 'request_path' },
				]);
			});
			expect(await inspector.columns()).to.deep.equal([
				{ table: 'page_visits', column: 'user_agent' },
				{ table: 'teams', column: 'name' },
				{ table: 'teams', column: 'created_at' },
				{ table: 'users', column: 'team_id' },
				{ table: 'users', column: 'id' },
				{ table: 'users', column: 'password' },
				{ table: 'teams', column: 'activated_at' },
				{ table: 'users', column: 'email' },
				{ table: 'teams', column: 'credits' },
				{ table: 'page_visits', column: 'created_at' },
				{ table: 'teams', column: 'id' },
				{ table: 'teams', column: 'description' },
				{ table: 'page_visits', column: 'request_path' },
			]);
		});

		it('returns information for specific table', async () => {
			expect(await inspector.columns('teams')).to.deep.equal([
				{ table: 'teams', column: 'id' },
				{ table: 'teams', column: 'name' },
				{ table: 'teams', column: 'description' },
				{ table: 'teams', column: 'credits' },
				{ table: 'teams', column: 'created_at' },
				{ table: 'teams', column: 'activated_at' },
			]);
		});
	});

	describe('.columnInfo', () => {
		it('returns information for all columns in all tables', async () => {
			expect(await inspector.columnInfo()).to.deep.equal([
				{
					name: 'team_id',
					table: 'users',
					type: 'integer',
					default_value: null,
					max_length: null,
					precision: 32,
					scale: 0,
					is_nullable: false,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: 'id',
					foreign_key_table: 'teams',
					comment: null,
					schema: 'public',
					foreign_key_schema: 'public',
				},
				{
					name: 'description',
					table: 'teams',
					type: 'text',
					default_value: null,
					max_length: null,
					precision: null,
					scale: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null,
					schema: 'public',
					foreign_key_schema: null,
				},
				{
					name: 'id',
					table: 'users',
					type: 'integer',
					default_value: null,
					max_length: null,
					precision: 32,
					scale: 0,
					is_nullable: false,
					is_primary_key: true,
					has_auto_increment: true,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null,
					schema: 'public',
					foreign_key_schema: null,
				},
				{
					name: 'request_path',
					table: 'page_visits',
					type: 'character varying',
					default_value: null,
					max_length: 100,
					precision: null,
					scale: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null,
					schema: 'public',
					foreign_key_schema: null,
				},
				{
					name: 'name',
					table: 'teams',
					type: 'character varying',
					default_value: null,
					max_length: 100,
					precision: null,
					scale: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null,
					schema: 'public',
					foreign_key_schema: null,
				},
				{
					name: 'created_at',
					table: 'page_visits',
					type: 'timestamp without time zone',
					default_value: null,
					max_length: null,
					precision: null,
					scale: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null,
					schema: 'public',
					foreign_key_schema: null,
				},
				{
					name: 'email',
					table: 'users',
					type: 'character varying',
					default_value: null,
					max_length: 100,
					precision: null,
					scale: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null,
					schema: 'public',
					foreign_key_schema: null,
				},
				{
					name: 'password',
					table: 'users',
					type: 'character varying',
					default_value: null,
					max_length: 60,
					precision: null,
					scale: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null,
					schema: 'public',
					foreign_key_schema: null,
				},
				{
					name: 'created_at',
					table: 'teams',
					type: 'timestamp without time zone',
					default_value: null,
					max_length: null,
					precision: null,
					scale: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null,
					schema: 'public',
					foreign_key_schema: null,
				},
				{
					name: 'activated_at',
					table: 'teams',
					type: 'date',
					default_value: null,
					max_length: null,
					precision: null,
					scale: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null,
					schema: 'public',
					foreign_key_schema: null,
				},
				{
					name: 'id',
					table: 'teams',
					type: 'integer',
					default_value: null,
					max_length: null,
					precision: 32,
					scale: 0,
					is_nullable: false,
					is_primary_key: true,
					has_auto_increment: true,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null,
					schema: 'public',
					foreign_key_schema: null,
				},
				{
					name: 'user_agent',
					table: 'page_visits',
					type: 'character varying',
					default_value: null,
					max_length: 200,
					precision: null,
					scale: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null,
					schema: 'public',
					foreign_key_schema: null,
				},
				{
					name: 'credits',
					table: 'teams',
					type: 'integer',
					default_value: null,
					max_length: null,
					precision: 32,
					scale: 0,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null,
					schema: 'public',
					foreign_key_schema: null,
				},
			]);
		});

		it('returns information for all columns in specific table', async () => {
			expect(await inspector.columnInfo('teams')).to.deep.equal([
				{
					name: 'id',
					table: 'teams',
					type: 'integer',
					default_value: null,
					max_length: null,
					precision: 32,
					scale: 0,
					is_nullable: false,
					is_primary_key: true,
					has_auto_increment: true,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null,
					schema: 'public',
					foreign_key_schema: null,
				},
				{
					name: 'name',
					table: 'teams',
					type: 'character varying',
					default_value: null,
					max_length: 100,
					precision: null,
					scale: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null,
					schema: 'public',
					foreign_key_schema: null,
				},
				{
					name: 'description',
					table: 'teams',
					type: 'text',
					default_value: null,
					max_length: null,
					precision: null,
					scale: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null,
					schema: 'public',
					foreign_key_schema: null,
				},
				{
					name: 'credits',
					table: 'teams',
					type: 'integer',
					default_value: null,
					max_length: null,
					precision: 32,
					scale: 0,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null,
					schema: 'public',
					foreign_key_schema: null,
				},
				{
					name: 'created_at',
					table: 'teams',
					type: 'timestamp without time zone',
					default_value: null,
					max_length: null,
					precision: null,
					scale: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null,
					schema: 'public',
					foreign_key_schema: null,
				},
				{
					name: 'activated_at',
					table: 'teams',
					type: 'date',
					default_value: null,
					max_length: null,
					precision: null,
					scale: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: null,
					schema: 'public',
					foreign_key_schema: null,
				},
			]);
		});

		it('returns information for a specific column in a specific table', async () => {
			expect(await inspector.columnInfo('teams', 'name')).to.deep.equal({
				schema: 'public',
				name: 'name',
				table: 'teams',
				type: 'character varying',
				default_value: null,
				max_length: 100,
				precision: null,
				scale: null,
				is_nullable: true,
				is_primary_key: false,
				has_auto_increment: false,
				foreign_key_schema: null,
				foreign_key_column: null,
				foreign_key_table: null,
				comment: null,
			});
		});
	});

	describe('.primary', () => {
		it('returns primary key for a table', async () => {
			expect(await inspector.primary('teams')).to.equal('id');
			expect(await inspector.primary('page_visits')).to.equal(null);
		});
	});

	describe('.transaction', () => {
		it('works with transactions transaction', async () => {
			database.transaction(async (trx) => {
				expect(await schema(trx).primary('teams')).to.equal('id');
			});
		});
	});
});

describe('postgres-with-search-path', () => {
	let database: Knex;
	let inspector: Schema;

	before(() => {
		database = Knex({
			searchPath: ['public', 'test'],
			client: 'pg',
			connection: {
				host: '127.0.0.1',
				port: 5101,
				user: 'postgres',
				password: 'secret',
				database: 'test_db',
				charset: 'utf8',
			},
		});
		inspector = schema(database);
	});

	after(async () => {
		await database.destroy();
	});

	describe('.primary', () => {
		it('returns primary key for a table', async () => {
			expect(await inspector.primary('test')).to.equal('id');
		});
	});

	describe('.transaction', () => {
		it('works with transactions transaction', async () => {
			database.transaction(async (trx) => {
				expect(await schema(trx).primary('test')).to.equal('id');
			});
		});
	});
});
