import request from 'supertest';
import config from '../config';
import { getDBsToTest } from '../get-dbs-to-test';
import knex, { Knex } from 'knex';
import { v4 as uuid } from 'uuid';
import { createEmployee, createEmployeePRJoinTable, createGitPR, seedTable } from '../setup/utils/factories';

describe('/items', () => {
	const databases = new Map<string, Knex>();
	const userID = uuid();
	const roleID = uuid();

	beforeEach(async () => {
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

				{
					collection: 'employees_git_prs',
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

	afterEach(async () => {
		for (const [vendor, connection] of databases) {
			const database = databases.get(vendor);
			await database!('directus_users').where('id', userID).del();
			await database!('directus_roles').where('id', roleID).del();
			await database!('directus_collections').where('collection', 'companys').del();
			await database!('directus_collections').where('collection', 'employees').del();
			await database!('directus_collections').where('collection', 'git_commits').del();
			await database!('directus_collections').where('collection', 'git_prs').del();
			await database!('directus_collections').where('collection', 'employees_git_prs').del();
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
		it.each(getDBsToTest())('%p retrieves all items from employees table with no relations', async (vendor) => {
			const url = `http://localhost:${config.ports[vendor]!}`;
			seedTable(databases.get(vendor)!, 100, 'employees', createEmployee);

			const response = await request(url)
				.get('/items/employees')
				.set('Authorization', 'Bearer test_token')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			expect(response.body.data.length).toBe(100);
			expect(Object.keys(response.body.data[0]).sort()).toStrictEqual([
				'git_email',
				'git_username',
				'id',
				'job_title',
				'name',
			]);
		});
		it.each(getDBsToTest())(
			'%p retrieves all items from employees table with a many to many relation',
			async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;
				const employee = createEmployee();
				const gitPR = createGitPR();
				const join = createEmployeePRJoinTable(employee.id, gitPR.id);
				await seedTable(databases.get(vendor)!, 1, 'employees', employee);
				await seedTable(databases.get(vendor)!, 1, 'git_prs', gitPR);
				await seedTable(databases.get(vendor)!, 1, 'employees_git_prs', join);

				const response = await request(url)
					.get('/items/employees')
					.set('Authorization', 'Bearer test_token')
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body.data.length).toBe(1);
				expect(Object.keys(response.body.data[0]).sort()).toStrictEqual([
					'git_email',
					'git_username',
					'id',
					'job_title',
					'name',
				]);
			}
		);
	});
	describe('/:collection/:id', () => {
		it.each(getDBsToTest())('%p retrieves one item', async (vendor) => {
			const url = `http://localhost:${config.ports[vendor]!}`;
			const item = await createEmployee();
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
