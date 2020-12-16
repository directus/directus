import Knex from 'knex';
import { expect } from 'chai';
import schema from '../src';
import { Schema } from '../src/types/schema-inspector';

describe('mysql', () => {
	let database: Knex;
	let inspector: Schema;

	before(() => {
		database = Knex({
			client: 'mysql',
			connection: {
				host: '127.0.0.1',
				port: 5100,
				user: 'root',
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
			expect(await inspector.tables()).to.deep.equal(['page_visits', 'teams', 'users']);
		});
	});

	describe('.tableInfo', () => {
		it('returns information for all tables', async () => {
			expect(await inspector.tableInfo()).to.deep.equal([
				{
					name: 'page_visits',
					schema: 'test_db',
					comment: '',
					collation: 'latin1_swedish_ci',
					engine: 'InnoDB',
				},
				{
					name: 'teams',
					schema: 'test_db',
					comment: '',
					collation: 'latin1_swedish_ci',
					engine: 'InnoDB',
				},
				{
					name: 'users',
					schema: 'test_db',
					comment: '',
					collation: 'latin1_swedish_ci',
					engine: 'InnoDB',
				},
			]);
		});

		it('returns information for specific table', async () => {
			expect(await inspector.tableInfo('teams')).to.deep.equal({
				collation: 'latin1_swedish_ci',
				comment: '',
				engine: 'InnoDB',
				name: 'teams',
				schema: 'test_db',
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
			expect(await inspector.columns()).to.deep.equal([
				{ table: 'page_visits', column: 'request_path' },
				{ table: 'page_visits', column: 'user_agent' },
				{ table: 'page_visits', column: 'created_at' },
				{ table: 'teams', column: 'id' },
				{ table: 'teams', column: 'name' },
				{ table: 'teams', column: 'description' },
				{ table: 'teams', column: 'credits' },
				{ table: 'teams', column: 'created_at' },
				{ table: 'teams', column: 'activated_at' },
				{ table: 'users', column: 'id' },
				{ table: 'users', column: 'team_id' },
				{ table: 'users', column: 'email' },
				{ table: 'users', column: 'password' },
			]);
		});

		it('returns information for specific table', async () => {
			expect(await inspector.columns('teams')).to.deep.equal([
				{ column: 'id', table: 'teams' },
				{ column: 'name', table: 'teams' },
				{ column: 'description', table: 'teams' },
				{ column: 'credits', table: 'teams' },
				{ column: 'created_at', table: 'teams' },
				{ column: 'activated_at', table: 'teams' },
			]);
		});
	});

	describe('.columnInfo', () => {
		it('returns information for all columns in all tables', async () => {
			expect(await inspector.columnInfo()).to.deep.equal([
				{
					name: 'team_id',
					table: 'users',
					type: 'int',
					default_value: null,
					max_length: null,
					precision: 10,
					scale: 0,
					is_nullable: false,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: 'id',
					foreign_key_table: 'teams',
					comment: '',
				},
				{
					name: 'id',
					table: 'teams',
					type: 'int',
					default_value: null,
					max_length: null,
					precision: 10,
					scale: 0,
					is_nullable: false,
					is_primary_key: true,
					has_auto_increment: true,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: '',
				},
				{
					name: 'id',
					table: 'users',
					type: 'int',
					default_value: null,
					max_length: null,
					precision: 10,
					scale: 0,
					is_nullable: false,
					is_primary_key: true,
					has_auto_increment: true,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: '',
				},
				{
					name: 'request_path',
					table: 'page_visits',
					type: 'varchar',
					default_value: null,
					max_length: 100,
					precision: null,
					scale: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: '',
				},
				{
					name: 'user_agent',
					table: 'page_visits',
					type: 'varchar',
					default_value: null,
					max_length: 200,
					precision: null,
					scale: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: '',
				},
				{
					name: 'created_at',
					table: 'page_visits',
					type: 'datetime',
					default_value: null,
					max_length: null,
					precision: null,
					scale: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: '',
				},
				{
					name: 'name',
					table: 'teams',
					type: 'varchar',
					default_value: null,
					max_length: 100,
					precision: null,
					scale: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: '',
				},
				{
					name: 'description',
					table: 'teams',
					type: 'text',
					default_value: null,
					max_length: 65535,
					precision: null,
					scale: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: '',
				},
				{
					name: 'credits',
					table: 'teams',
					type: 'int',
					default_value: null,
					max_length: null,
					precision: 10,
					scale: 0,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: 'Remaining usage credits',
				},
				{
					name: 'created_at',
					table: 'teams',
					type: 'datetime',
					default_value: null,
					max_length: null,
					precision: null,
					scale: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: '',
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
					comment: '',
				},
				{
					name: 'email',
					table: 'users',
					type: 'varchar',
					default_value: null,
					max_length: 100,
					precision: null,
					scale: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: '',
				},
				{
					name: 'password',
					table: 'users',
					type: 'varchar',
					default_value: null,
					max_length: 60,
					precision: null,
					scale: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: '',
				},
			]);
		});

		it('returns information for all columns in specific table', async () => {
			expect(await inspector.columnInfo('teams')).to.deep.equal([
				{
					name: 'id',
					table: 'teams',
					type: 'int',
					default_value: null,
					max_length: null,
					precision: 10,
					scale: 0,
					is_nullable: false,
					is_primary_key: true,
					has_auto_increment: true,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: '',
				},
				{
					name: 'name',
					table: 'teams',
					type: 'varchar',
					default_value: null,
					max_length: 100,
					precision: null,
					scale: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: '',
				},
				{
					name: 'description',
					table: 'teams',
					type: 'text',
					default_value: null,
					max_length: 65535,
					precision: null,
					scale: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: '',
				},
				{
					name: 'credits',
					table: 'teams',
					type: 'int',
					default_value: null,
					max_length: null,
					precision: 10,
					scale: 0,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: 'Remaining usage credits',
				},
				{
					name: 'created_at',
					table: 'teams',
					type: 'datetime',
					default_value: null,
					max_length: null,
					precision: null,
					scale: null,
					is_nullable: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
					comment: '',
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
					comment: '',
				},
			]);
		});

		it('returns information for a specific column in a specific table', async () => {
			expect(await inspector.columnInfo('teams', 'name')).to.deep.equal({
				name: 'name',
				table: 'teams',
				type: 'varchar',
				default_value: null,
				max_length: 100,
				precision: null,
				scale: null,
				is_nullable: true,
				is_primary_key: false,
				has_auto_increment: false,
				foreign_key_column: null,
				foreign_key_table: null,
				comment: '',
			});
		});
	});

	describe('.primary', () => {
		it('returns primary key for a table', async () => {
			expect(await inspector.primary('teams')).to.equal('id');
			expect(await inspector.primary('page_visits')).to.equal(null);
		});
	});
});
