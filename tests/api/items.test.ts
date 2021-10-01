import request from 'supertest';
import config from '../config';
import { getDBsToTest } from '../get-dbs-to-test';
import knex, { Knex } from 'knex';
import { v4 as uuid } from 'uuid';

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

			await database!('directus_collections').insert({
				collection: 'test_collection',
			});
			await database!.schema.createTableIfNotExists('test_collection', (table) => {
				table.uuid('id').primary();
			});
		}
	});

	afterAll(async () => {
		for (const [vendor, connection] of databases) {
			const database = databases.get(vendor);
			await database!('directus_users').where('id', userID).del();
			await database!('directus_roles').where('id', roleID).del();
			await database!('directus_collections').where('collection', 'test_collection').del();

			await database!.schema.dropTableIfExists('test_collection');
			connection.destroy();
		}
	});

	describe('/:collection', () => {
		it.each(getDBsToTest())('%p retrieves all items', async (vendor) => {
			const url = `http://localhost:${config.ports[vendor]!}`;

			const response = await request(url)
				.get('/items/test_collection')
				.set('Authorization', 'Bearer test_token')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			expect(response.body).toStrictEqual({ data: [] });
		});
	});
});
