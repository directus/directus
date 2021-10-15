import request from 'supertest';
import config from '../config';
import { getDBsToTest } from '../get-dbs-to-test';
import knex, { Knex } from 'knex';
import { v4 as uuid } from 'uuid';
import { createArtist, seedTable } from '../setup/utils/factories';

describe('/items', () => {
	const databases = new Map<string, Knex>();
	const userId = uuid();
	const roleId = uuid();

	beforeEach(async () => {
		const vendors = getDBsToTest();

		for (const vendor of vendors) {
			databases.set(vendor, knex(config.knexConfig[vendor]!));
			const database = databases.get(vendor);
			await database!('directus_roles').insert({
				id: roleId,
				name: 'test',
				icon: 'verified',
				admin_access: true,
				description: 'test admin role',
			});

			await database!('directus_users').insert({
				id: userId,
				status: 'active',
				email: 'test@example.com',
				password: 'password',
				first_name: 'Admin',
				last_name: 'User',
				role: roleId,
				token: 'test_token',
			});

			await database!('directus_collections').insert([
				{
					collection: 'users',
				},
				{
					collection: 'artists',
				},
				{
					collection: 'events',
				},
				{
					collection: 'tours',
				},
				{
					collection: 'organizers',
				},
			]);

			if ((await database!.schema.hasTable('artists')) === false) {
				await database!.schema.createTable('artists', (table) => {
					table.increments('id').primary();
					table.string('name');
					table.json('members');
				});
			}

			if ((await database!.schema.hasTable('users')) === false) {
				await database!.schema.createTable('users', (table) => {
					table.increments('id');
					table.string('name');
					table.date('birthday');
					table.string('search_radius');
					table.time('earliest_events_to_show');
					table.time('latest_events_to_show');
					table.string('password');
					table.integer('shows_attended');
					table.integer('favorite_artist').unsigned().references('id').inTable('artists');
				});
			}
		}
	});

	afterEach(async () => {
		for (const [vendor, connection] of databases) {
			const database = databases.get(vendor)!;
			await database('directus_users').where('id', userId).del();
			await database('directus_roles').where('id', roleId).del();
			await database('directus_collections').where('collection', 'users').del();
			await database('directus_collections').where('collection', 'artists').del();
			await database('directus_collections').where('collection', 'events').del();
			await database('directus_collections').where('collection', 'tours').del();
			await database('directus_collections').where('collection', 'organizers').del();

			await database.schema.dropTableIfExists('artists_events');
			await database.schema.dropTableIfExists('tours_components');
			await database.schema.dropTableIfExists('users');
			await database.schema.dropTableIfExists('artists');
			await database.schema.dropTableIfExists('events');
			await database.schema.dropTableIfExists('tours');
			await database.schema.dropTableIfExists('organizers');

			connection.destroy();
		}
	});

	describe('/:collection GET', () => {
		it.each(getDBsToTest())('%p retrieves all items from artist table with no relations', async (vendor) => {
			const url = `http://localhost:${config.ports[vendor]!}`;
			seedTable(databases.get(vendor)!, 100, 'artists', createArtist);

			const response = await request(url)
				.get('/items/artists')
				.set('Authorization', 'Bearer test_token')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			expect(response.body.data.length).toBe(100);
			expect(Object.keys(response.body.data[0]).sort()).toStrictEqual(['id', 'members', 'name']);
		});
	});
	describe('/:collection/:id', () => {
		it.each(getDBsToTest())('%p retrieves one item', async (vendor) => {
			const url = `http://localhost:${config.ports[vendor]!}`;
			const artist = createArtist();
			await databases.get(vendor)!('artists').insert(artist);

			const response = await request(url)
				.get(`/items/artists/1`)
				.set('Authorization', 'Bearer test_token')
				.expect('Content-Type', /application\/json/)
				.expect(200);

			artist.id = 1;
			if (vendor === 'postgres') {
				artist.members = JSON.parse(artist.members);
				expect(response.body.data).toStrictEqual(artist);
			} else {
				expect(response.body.data).toStrictEqual(artist);
			}
		});
	});
});
