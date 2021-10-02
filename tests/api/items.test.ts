import request from 'supertest';
import config from '../config';
import { getDBsToTest } from '../get-dbs-to-test';
import knex, { Knex } from 'knex';
import { v4 as uuid } from 'uuid';
import { address } from 'faker';
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

			await database!('directus_collections').insert({
				collection: 'address',
			});
			await database!.schema.createTableIfNotExists('address', (table) => {
				table.uuid('id').primary();
				table.string('streetName');
				table.string('city');
				table.string('zipCode');
				table.string('country');
			});
		}
	});

	afterEach(async () => {
		for (const [vendor, connection] of databases) {
			const database = databases.get(vendor);
			await database!('directus_users').where('id', userID).del();
			await database!('directus_roles').where('id', roleID).del();
			await database!('directus_collections').where('collection', 'address').del();

			await database!.schema.dropTableIfExists('address');
			connection.destroy();
		}
	});

	const createAddress = () => ({
		id: uuid(),
		streetName: address.streetName(),
		city: address.city(),
		zipCode: address.zipCode(),
		country: address.country(),
	});

	const seedAddress = async function (knex: Knex<any, unknown>, count: number): Promise<void> {
		const fakeAddresses = [];

		for (let i = 0; i < count; i++) {
			fakeAddresses.push(createAddress());
		}
		await knex('address').insert(fakeAddresses);
	};

	describe('/:collection', () => {
		it.each(getDBsToTest())('%p retrieves all items', async (vendor) => {
			const url = `http://localhost:${config.ports[vendor]!}`;
			seedAddress(databases.get(vendor)!, 10);

			const response = await request(url)
				.get('/items/address')
				.set('Authorization', 'Bearer test_token')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			expect(response.body.data.length).toBe(10);
			expect(Object.keys(response.body.data[0]).sort()).toStrictEqual([
				'city',
				'country',
				'id',
				'streetName',
				'zipCode',
			]);
		});
	});

	describe('/:collection/:id', () => {
		it.each(getDBsToTest())('%p retrieves one item', async (vendor) => {
			const url = `http://localhost:${config.ports[vendor]!}`;
			const item = createAddress();
			await databases.get(vendor)!('address').insert(item);

			const response = await request(url)
				.get(`/items/address/${item.id}`)
				.set('Authorization', 'Bearer test_token')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			if (vendor === 'mssql') {
				expect(response.body.data).toStrictEqual({
					id: item.id.toUpperCase(),
					streetName: item.streetName,
					city: item.city,
					zipCode: item.zipCode,
					country: item.country,
				});
			} else {
				expect(response.body.data).toStrictEqual(item);
			}
		});
	});
});
