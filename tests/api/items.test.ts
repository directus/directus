import request from 'supertest';
import config from '../config';
import { getDBsToTest } from '../get-dbs-to-test';
import knex, { Knex } from 'knex';
import { v4 as uuid } from 'uuid';
import { createEmployee, seedTable } from '../setup/utils/factories';

describe('/items', () => {
	const databases = new Map<string, Knex>();
	const userID = uuid();
	const roleID = uuid();

	beforeAll(async () => {
		const vendors = getDBsToTest();

		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));
			const database = databases.get(vendor);

			await database!('directus_roles').insert({
				id: roleID,
				name: 'test',
				icon: 'verified',
				admin_access: true,
				description: 'test admin role',
			});

			await database!('directus_users').insert({
				id: userID,
				status: 'active',
				email: 'test@example.com',
				password: 'password',
				first_name: 'Admin',
				last_name: 'User',
				role: roleID,
				token: 'test_token',
			});

			await database!('directus_collections').insert([
				{
					collection: 'employees',
				},
				{
					collection: 'companys',
				},

				{
					collection: 'git_commits',
				},
				{
					collection: 'git_prs',
				},
				{
					collection: 'profile_pics',
				},
			]);
			if ((await database!.schema.hasTable('employees')) === false) {
				await database!.schema.createTable('employees', (table) => {
					table.uuid('id').primary();
					table.string('git_email');
					table.string('git_username');
					table.string('name');
					table.string('job_title');
				});
			}

			// M2O: Employees => Company
			if ((await database!.schema.hasTable('companys')) === false) {
				await database!.schema.createTable('companys', (table) => {
					table.uuid('id').primary();
					table.string('name');
					table.string('slogan');
				});
			}

			database!.schema.alterTable('employees', (table) => {
				table.uuid('company').references('company.id');
			});

			await database!('directus_relations').insert({
				many_collection: 'employees',
				many_field: 'company',
				one_collection: 'companys',
			});

			// O2M: Employees => git commits
			if ((await database!.schema.hasTable('git_commits')) === false) {
				await database!.schema.createTable('git_commits', (table) => {
					table.uuid('id').primary();
					table.string('branch');
					table.string('commit');
					table.string('message');
					table.string('sha');
					table.string('short_sha');
					table.uuid('employee').references('employees.id');
				});
			}

			database!.schema.alterTable('employees', (table) => {
				table.uuid('git_commits').unique().references('git_commits.id');
			});

			await database!('directus_relations').insert({
				one_collection: 'employees',
				many_collection: 'git_commits',
				many_field: 'git_commits',
			});

			// O2O: Employees => Profile Pics
			if ((await database!.schema.hasTable('profile_pics')) === false) {
				await database!.schema.createTable('profile_pics', (table) => {
					table.uuid('id').primary();
					table.string('source');
					table.uuid('employee').unique().references('employees.id');
				});
			}
			database!.schema.alterTable('employees', (table) => {
				table.uuid('profile_pics').unique().references('profile_pics.id');
			});

			// M2M: Employees => git Pull Requests, join table required
			if ((await database!.schema.hasTable('git_prs')) === false) {
				await database!.schema.createTable('git_prs', (table) => {
					table.uuid('id').primary();
					table.string('branch');
					table.string('name');
				});
			}

			if ((await database!.schema.hasTable('employees_git_prs')) === false) {
				await database!.schema.createTable('employees_git_prs', (table) => {
					table.uuid('id').primary();
					table.uuid('employee_id').references('employees.id');
					table.uuid('git_pr_id').references('git_prs.id');
				});
			}

			database!.schema.alterTable('git_prs', (table) => {
				table.uuid('employee').references('employees_git_prs.employee_id');
			});
			database!.schema.alterTable('employees', (table) => {
				table.uuid('git_pr').references('employees_git_prs.git_pr_id');
			});
			await database!('directus_relations').insert({
				many_collection: 'employees_git_prs',
				one_collection: 'employees',
				many_field: 'git_prs',
			});

			await database!('directus_relations').insert({
				many_collection: 'employees_git_prs',
				one_collection: 'git_prs',
				many_field: 'employee',
			});
		}
	});

	afterAll(async () => {
		for (const [vendor, connection] of databases) {
			const database = databases.get(vendor);
			await database!('directus_users').where('id', userID).del();
			await database!('directus_roles').where('id', roleID).del();
			await database!('directus_collections').where('collection', 'companys').del();
			await database!('directus_collections').where('collection', 'employees').del();
			await database!('directus_collections').where('collection', 'git_commits').del();
			await database!('directus_collections').where('collection', 'git_prs').del();
			await database!('directus_collections').where('collection', 'profile_pics').del();
			await database!('directus_relations').where('many_collection', 'employees').del();
			await database!('directus_relations').where('one_collection', 'employees').del();
			await database!('directus_relations').where('one_collection', 'git_prs').del();

			await database!.schema.dropTableIfExists('profile_pics');
			await database!.schema.dropTableIfExists('git_commits');
			await database!.schema.dropTableIfExists('companys');
			await database!.schema.dropTableIfExists('employees_git_prs');
			await database!.schema.dropTableIfExists('git_prs');
			await database!.schema.dropTableIfExists('employees');

			connection.destroy();
		}
	});

	describe('/:collection GET', () => {
		it.each(getDBsToTest())('%p retrieves all items from employees table', async (vendor) => {
			const url = `http://localhost:${config.ports[vendor]!}`;
			seedTable(databases.get(vendor)!, 5, 'employees', createEmployee);

			const response = await request(url)
				.get('/items/employees')
				.set('Authorization', 'Bearer test_token')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			expect(response.body.data.length).toBe(5);
			expect(Object.keys(response.body.data[0]).sort()).toStrictEqual([
				'git_email',
				'git_username',
				'id',
				'job_title',
				'name',
			]);
		});
	});

	describe('/:collection/:id', () => {
		it.each(getDBsToTest())('%p retrieves one item', async (vendor) => {
			const url = `http://localhost:${config.ports[vendor]!}`;
			const item = createEmployee();
			await databases.get(vendor)!('employees').insert(item);

			const response = await request(url)
				.get(`/items/employees/${item.id}`)
				.set('Authorization', 'Bearer test_token')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			if (vendor === 'mssql') {
				expect(response.body.data).toStrictEqual({
					id: item.id.toUpperCase(),
					git_email: item.git_email,
					git_username: item.git_username,
					name: item.name,
					job_title: item.job_title,
				});
			} else {
				expect(response.body.data).toStrictEqual(item);
			}
		});
	});
});
